import { render, screen } from '@testing-library/react'
import ConversationBubble from './ConversationBubble'
import { Message } from '@/stores/sessionStore'

describe('ConversationBubble', () => {
  test('renders user message with correct style', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: '我认为这道题应该用代入法',
      timestamp: new Date(),
    }
    render(<ConversationBubble message={message} />)
    expect(screen.getByText('我认为这道题应该用代入法')).toBeInTheDocument()
  })

  test('renders assistant message with correct style', () => {
    const message: Message = {
      id: '2',
      role: 'assistant',
      content: '你的意思是先列方程再求解吗？',
      timestamp: new Date(),
    }
    render(<ConversationBubble message={message} />)
    expect(screen.getByText('你的意思是先列方程再求解吗？')).toBeInTheDocument()
  })
})
