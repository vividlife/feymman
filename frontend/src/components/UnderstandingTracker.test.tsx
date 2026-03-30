import { render, screen } from '@testing-library/react'
import UnderstandingTracker from './UnderstandingTracker'
import { useSessionStore } from '@/stores/sessionStore'

describe('UnderstandingTracker', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  test('renders with zero progress', () => {
    render(<UnderstandingTracker />)
    expect(screen.getByText('等待开始讲解...')).toBeInTheDocument()
  })

  test('displays understood points with checkmarks', () => {
    useSessionStore.getState().addUnderstoodPoint('题目目标')
    render(<UnderstandingTracker />)
    expect(screen.getByText('题目目标')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  test('displays unclear points with question marks', () => {
    useSessionStore.getState().addUnclearPoint('为什么用这个方法')
    render(<UnderstandingTracker />)
    expect(screen.getByText('为什么用这个方法')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
