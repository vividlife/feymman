import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'
import UnderstandingTracker from '@/components/UnderstandingTracker'
import ConversationBubble from '@/components/ConversationBubble'
import { Button } from '@/components/ui/button'

export default function SessionPage() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)

  const {
    sessionId,
    state,
    problemText,
    subject,
    messages,
    currentTranscript,
    understandingLevel,
    setProblemText,
    setSubject,
  } = useSessionStore()

  const { connect, disconnect } = useWebSocket()

  // 从 sessionStorage 恢复数据
  useEffect(() => {
    const savedProblem = sessionStorage.getItem('problemText')
    const savedSubject = sessionStorage.getItem('subject')
    if (savedProblem) setProblemText(savedProblem)
    if (savedSubject) setSubject(savedSubject)
  }, [setProblemText, setSubject])

  // 自动连接
  useEffect(() => {
    if (!sessionId && problemText) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [sessionId, problemText, connect, disconnect])

  const handleToggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: 实际控制麦克风录制
  }

  const handleEnd = () => {
    disconnect()
    navigate('/result')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部：题目信息 */}
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">{subject}</span>
              <h2 className="font-medium line-clamp-1">{problemText}</h2>
            </div>
            <span className="text-sm text-blue-500">
              {state === 'listening' && '等待你讲解...'}
              {state === 'responding' && 'AI 思考中...'}
              {state === 'connecting' && '连接中...'}
            </span>
          </div>
        </div>
      </div>

      {/* 中部：对话流 */}
      <div className="flex-1 container mx-auto max-w-2xl p-4 overflow-y-auto">
        <div className="space-y-4 mb-4">
          {messages.map((msg) => (
            <ConversationBubble key={msg.id} message={msg} />
          ))}
        </div>
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="bg-blue-100 text-blue-800 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">{currentTranscript}</p>
              <p className="text-xs text-blue-400 mt-1">转写中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 理解进度 */}
      <div className="container mx-auto max-w-2xl px-4">
        <UnderstandingTracker />
      </div>

      {/* 底部：控制区 */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-2xl flex justify-center gap-4">
          <AudioRecorder
            onAudioData={() => {}}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
          />
          <Button variant="outline" onClick={handleEnd}>
            结束本轮
          </Button>
        </div>
      </div>
    </div>
  )
}
