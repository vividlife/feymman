import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const {
    sessionId,
    problemText,
    subject,
    setSessionId,
    setState,
    addMessage,
    updateCurrentTranscript,
    setUnderstandingLevel,
    addUnderstoodPoint,
    addUnclearPoint,
    removeUnclearPoint,
  } = useSessionStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setState('connecting')
    const ws = new WebSocket(`ws://localhost:3000`)

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
        case 'error':
          console.error('WS error:', data.message)
          setState('error')
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setState('error')
    }

    ws.onclose = () => {
      setState('idle')
    }

    wsRef.current = ws
  }, [problemText, subject, setSessionId, setState, addMessage, updateCurrentTranscript])

  const sendAudio = useCallback((audioData: Blob) => {
    // 简化：直接发送音频 blob
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // 这里需要将 blob 转为 base64 发送
      // 实际实现中需要使用 input_audio_buffer.append 事件
    }
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

  return { connect, disconnect, sendAudio }
}
