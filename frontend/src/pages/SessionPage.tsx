import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import AudioRecorder from '@/components/AudioRecorder'
import UnderstandingTracker from '@/components/UnderstandingTracker'
import ConversationBubble from '@/components/ConversationBubble'
import { Button } from '@/components/ui/button'

export default function SessionPage() {
  const navigate = useNavigate()

  const {
    sessionId,
    state,
    problemText,
    subject,
    messages,
    currentTranscript,
  } = useSessionStore()

  const { connect, disconnect, sendAudioMessage } = useWebSocket()
  const { isRecording, startRecording, stopRecording } = useAudioRecorder()

  // Auto-connect when problemText is available
  useEffect(() => {
    if (!sessionId && problemText) {
      connect()
    }
  }, [sessionId, problemText, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording((pcmBase64) => {
        sendAudioMessage(pcmBase64)
      })
    }
  }, [isRecording, startRecording, stopRecording, sendAudioMessage])

  const handleEnd = useCallback(() => {
    stopRecording()
    disconnect()
    navigate('/result')
  }, [stopRecording, disconnect, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">{subject}</span>
              <h2 className="font-medium line-clamp-1">{problemText}</h2>
            </div>
            <span className="text-sm text-blue-500">
              {state === 'listening' && '等待你讲解...'}
              {state === 'responding' && 'AI 回复中...'}
              {state === 'connecting' && '连接中...'}
              {state === 'idle' && '未连接'}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 container mx-auto max-w-2xl p-4 overflow-y-auto">
        <div className="space-y-4 mb-4">
          {messages.map((msg) => (
            <ConversationBubble key={msg.id} message={msg} />
          ))}
        </div>
        {currentTranscript && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">{currentTranscript}</p>
              <p className="text-xs text-gray-400 mt-1">AI 回复中...</p>
            </div>
          </div>
        )}
      </div>

      {/* Understanding tracker */}
      <div className="container mx-auto max-w-2xl px-4">
        <UnderstandingTracker />
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-2xl flex justify-center gap-4">
          <AudioRecorder
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            disabled={state !== 'listening' && state !== 'responding' && !isRecording}
          />
          <Button variant="outline" onClick={handleEnd}>
            结束本轮
          </Button>
        </div>
      </div>
    </div>
  )
}
