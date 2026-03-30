import { Message } from '@/stores/sessionStore'

interface ConversationBubbleProps {
  message: Message
}

const typeLabels: Record<string, string> = {
  question: '追问',
  clarification: '澄清',
  summary: '总结',
  confirmation: '确认',
  success: '完成',
}

export default function ConversationBubble({ message }: ConversationBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {message.type && (
            <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {typeLabels[message.type] || message.type}
            </span>
          )}
          <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}
