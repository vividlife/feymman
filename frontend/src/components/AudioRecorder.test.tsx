import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AudioRecorder from './AudioRecorder'

describe('AudioRecorder', () => {
  test('shows "开始说" when not recording', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={onToggleRecording} />)
    expect(screen.getByText('开始说')).toBeInTheDocument()
  })

  test('shows "停止" when recording', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={true} onToggleRecording={onToggleRecording} />)
    expect(screen.getByText('停止')).toBeInTheDocument()
  })

  test('calls onToggleRecording when button is clicked', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={onToggleRecording} />)
    fireEvent.click(screen.getByText('开始说'))
    expect(onToggleRecording).toHaveBeenCalledTimes(1)
  })

  test('button is disabled when disabled prop is true', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={onToggleRecording} disabled={true} />)
    const button = screen.getByText('开始说').closest('button')
    expect(button).toBeDisabled()
  })

  test('button is not disabled when disabled prop is false', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={onToggleRecording} disabled={false} />)
    const button = screen.getByText('开始说').closest('button')
    expect(button).not.toBeDisabled()
  })

  test('shows correct status message when not recording', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={false} onToggleRecording={onToggleRecording} />)
    expect(screen.getByText('点击开始讲解')).toBeInTheDocument()
  })

  test('shows correct status message when recording', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={true} onToggleRecording={onToggleRecording} />)
    expect(screen.getByText('正在收音... 点击停止发送')).toBeInTheDocument()
  })

  test('button has destructive variant when recording', () => {
    const onToggleRecording = vi.fn()
    render(<AudioRecorder isRecording={true} onToggleRecording={onToggleRecording} />)
    const button = screen.getByText('停止').closest('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
