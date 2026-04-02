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
    console.log('[WS] Connecting to ws://localhost:8082...')
    const ws = new WebSocket(`ws://localhost:8082`)

    ws.onopen = () => {
      console.log('[WS] Connected!')
      // 初始化会话
      console.log('[WS] Sending session.init:', { problemText, subject })
      ws.send(JSON.stringify({
        type: 'session.init',
        problemText,
        subject,
      }))
    }

    ws.onmessage = (event) => {
      console.log('[WS] Received:', event.data)
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'session.created':
          console.log('[WS] Session created:', data.sessionId)
          setSessionId(data.sessionId)
          setState('listening')
          break
        case 'session.updated':
          // 服务器返回的是 session.updated，包含完整的 session 对象
          console.log('[WS] Session updated, id:', data.session?.id)
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
        case 'conversation.item.input_audio_transcription.completed':
          addMessage({
            id: `msg_${Date.now()}`,
            role: 'user',
            content: data.transcript,
            timestamp: new Date(),
          })
          break
        case 'response.created':
          console.log('[WS] AI started responding')
          setState('responding')
          break
        case 'response.done':
          console.log('[WS] AI finished responding')
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
      console.log('[WS] Connection closed')
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

    console.log('[WS] Sending audio data, length:', audioBase64.length)
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
