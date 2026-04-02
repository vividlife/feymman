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
    // Skip if already connected or connecting
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return

    setState('connecting')
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8082'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'session.init',
        problemText,
        subject,
      }))
    }

    ws.onmessage = (event) => {
      // Ignore messages from stale WebSocket
      if (ws !== wsRef.current) return

      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }

      switch (data.type) {
        case 'session.created':
          if (data.sessionId) {
            setSessionId(data.sessionId)
          }
          setState('listening')
          break
        case 'session.updated':
          setState('listening')
          break
        case 'response.audio_transcript.delta':
          updateCurrentTranscript((useSessionStore.getState().currentTranscript || '') + data.delta)
          break
        case 'response.audio_transcript.done': {
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
        }
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

    ws.onerror = () => {
      // Only update state if this is still the active WebSocket
      if (ws !== wsRef.current) return
      setState('error')
    }

    ws.onclose = () => {
      // Only update state if this is still the active WebSocket
      if (ws !== wsRef.current) return
      setState('idle')
    }

    wsRef.current = ws
  }, [problemText, subject, setSessionId, setState, addMessage, updateCurrentTranscript])

  const sendAudioMessage = useCallback((audioBase64: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioBase64,
    }))
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      // Clear handlers before closing to prevent stale callbacks
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onerror = null
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, sendAudioMessage }
}
