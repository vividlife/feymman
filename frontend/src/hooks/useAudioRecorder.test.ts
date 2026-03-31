import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioRecorder } from './useAudioRecorder'

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(() => {
    // Automatically call onstop when stop is called
    if (mockMediaRecorder.onstop) {
      mockMediaRecorder.onstop()
    }
  }),
  ondataavailable: null as ((event: { data: Blob }) => void) | null,
  onstart: null as (() => void) | null,
  onstop: null as (() => void) | null,
  onerror: null as ((event: Event) => void) | null,
  state: 'inactive',
}

const mockStream = {
  id: 'test-stream-id',
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
  active: true,
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mockMediaRecorder handlers
    mockMediaRecorder.ondataavailable = null
    mockMediaRecorder.onstart = null
    mockMediaRecorder.onstop = null
    mockMediaRecorder.onerror = null
    mockMediaRecorder.state = 'inactive'

    // Mock navigator.mediaDevices with getUserMedia
    const mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    }
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices,
    })

    // Mock MediaRecorder
    vi.stubGlobal('MediaRecorder', vi.fn(() => mockMediaRecorder))

    // Mock isTypeSupported on MediaRecorder class
    MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)
  })

  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000)
    expect(result.current.isRecording).toBe(true)
  })

  it('should stop recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    await act(async () => {
      await result.current.stopRecording()
    })

    expect(mockMediaRecorder.stop).toHaveBeenCalled()
    expect(result.current.isRecording).toBe(false)
  })

  it('should collect audio data chunks and create blob on stop', async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    // Simulate data available
    const mockData = new Blob(['test-audio-data'], { type: 'audio/webm' })
    act(() => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockData } as unknown as Event)
      }
    })

    // stop() now automatically triggers onstop in the mock
    await act(async () => {
      await result.current.stopRecording()
    })

    expect(result.current.audioBlob).toBeTruthy()
  })

  it('should return base64 string from getAudioBase64', async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    const mockData = new Blob(['test-audio-data'], { type: 'audio/webm' })
    act(() => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockData } as unknown as Event)
      }
    })

    await act(async () => {
      await result.current.stopRecording()
    })

    const base64 = await result.current.getAudioBase64()
    expect(base64).toBeTruthy()
    expect(typeof base64).toBe('string')
    // Base64 should contain only valid characters
    expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should return null from getAudioBase64 when no audio recorded', async () => {
    const { result } = renderHook(() => useAudioRecorder())

    const base64 = await result.current.getAudioBase64()
    expect(base64).toBeNull()
  })
})
