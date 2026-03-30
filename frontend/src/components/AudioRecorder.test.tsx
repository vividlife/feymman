import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AudioRecorder from './AudioRecorder'

// Mock the useAudioRecorder hook
const mockUseAudioRecorder = vi.fn(() => ({
  isRecording: false,
  startRecording: vi.fn().mockResolvedValue(undefined),
  stopRecording: vi.fn().mockResolvedValue(undefined),
  getAudioBase64: vi.fn().mockResolvedValue('mock-base64'),
}))

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => mockUseAudioRecorder(),
}))

describe('AudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAudioRecorder.mockReturnValue({
      isRecording: false,
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn().mockResolvedValue(undefined),
      getAudioBase64: vi.fn().mockResolvedValue('mock-base64'),
    })
  })

  test('shows "开始说" when hook reports not recording', () => {
    mockUseAudioRecorder.mockReturnValue({
      ...mockUseAudioRecorder(),
      isRecording: false,
    })
    render(<AudioRecorder onAudioData={vi.fn()} />)
    expect(screen.getByText('开始说')).toBeInTheDocument()
  })

  test('shows "停止" when hook reports recording', () => {
    mockUseAudioRecorder.mockReturnValue({
      ...mockUseAudioRecorder(),
      isRecording: true,
    })
    render(<AudioRecorder onAudioData={vi.fn()} />)
    expect(screen.getByText('停止')).toBeInTheDocument()
  })

  test('calls startRecording when clicking button while not recording', async () => {
    const startRecording = vi.fn().mockResolvedValue(undefined)
    mockUseAudioRecorder.mockReturnValue({
      isRecording: false,
      startRecording,
      stopRecording: vi.fn().mockResolvedValue(undefined),
      getAudioBase64: vi.fn().mockResolvedValue('mock-base64'),
    })

    render(<AudioRecorder onAudioData={vi.fn()} />)
    fireEvent.click(screen.getByText('开始说'))

    // The button click should trigger startRecording via handleToggle
    expect(startRecording).toHaveBeenCalled()
  })
})
