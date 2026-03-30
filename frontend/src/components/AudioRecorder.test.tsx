import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AudioRecorder from './AudioRecorder'

describe('AudioRecorder', () => {
  test('shows "开始说" when not recording', () => {
    render(<AudioRecorder isRecording={false} onToggleRecording={() => {}} />)
    expect(screen.getByText('开始说')).toBeInTheDocument()
  })

  test('shows "停止" when recording', () => {
    render(<AudioRecorder isRecording={true} onToggleRecording={() => {}} />)
    expect(screen.getByText('停止')).toBeInTheDocument()
  })

  test('calls onToggleRecording when button clicked', () => {
    const mockToggle = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={mockToggle} />)
    fireEvent.click(screen.getByText('开始说'))
    expect(mockToggle).toHaveBeenCalled()
  })
})
