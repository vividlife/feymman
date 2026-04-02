import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)

  const {
    problemText,
    subject,
    setSessionId,
    setState,
    addMessage,
    updateCurrentTranscript,
  } = useSessionStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setState('connecting')
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8082'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      // 初始化会话
      ws.send(JSON.stringify({
        type: 'session.init',
        problemText,
        subject,
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'session.created':
          setSessionId(data.sessionId)
          setState('listening')
          break
        case 'session.updated':
          // 服务器返回的是 session.updated，包含完整的 session 对象
          if (data.session?.id) {
            setSessionId(data.session.id)
          }
          setState('listening')
          break
        case 'response.audio_transcript.delta':
          updateCurrentTranscript((useSessionStore.getState().currentTranscript || '') + data.delta)
          break
        case 'response.audio_transcript.done':
          const transcript = useSessionStore.getState().currentTranscript
          if (transcript) {
            addMessage({
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: transcript,
              timestamp: new Date(),
            })
            updateCurrentTranscript('')
          }
          setState('listening')
          break
        case 'response.audio.delta':
          useSessionStore.getState().addAudioChunk(data.delta)
          break
        case 'conversation.item.input_audio_transcription.completed':
          addMessage({
            id: `msg_${Date.now()}`,
            role: 'user',
            content: data.transcript,
            timestamp: new Date(),
          })
          break
        case 'response.created':
          setState('responding')
          break
        case 'response.done':
          setState('listening')
          break
        case 'error':
          console.error('[WS] Error:', data.message)
          setState('error')
          break
      }
    }

    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error)
      setState('error')
    }

    ws.onclose = () => {
      setState('idle')
    }

    wsRef.current = ws
  }, [problemText, subject, setSessionId, setState, addMessage, updateCurrentTranscript])

  // 发送音频数据到后端
  const sendAudioMessage = useCallback((audioBase64: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WS] Cannot send audio - WebSocket not connected')
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioBase64,
    }))
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, sendAudioMessage }
}
