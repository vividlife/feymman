import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioRecorder } from './useAudioRecorder'

// Mock AudioContext and related Web Audio API
const mockProcessor = {
  onaudioprocess: null as ((e: AudioProcessingEvent) => void) | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockSource = {
  connect: vi.fn(),
}

const mockContext = {
  createMediaStreamSource: vi.fn(() => mockSource),
  createScriptProcessor: vi.fn(() => mockProcessor),
  close: vi.fn().mockResolvedValue(undefined),
  destination: {},
}

const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockProcessor.onaudioprocess = null
    mockProcessor.connect.mockReset()
    mockProcessor.disconnect.mockReset()
    mockSource.connect.mockReset()
    mockContext.createMediaStreamSource.mockReturnValue(mockSource)
    mockContext.createScriptProcessor.mockReturnValue(mockProcessor)

    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })

    vi.stubGlobal('AudioContext', vi.fn(() => mockContext))
  })

  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    const onPcmData = vi.fn()

    await act(async () => {
      await result.current.startRecording(onPcmData)
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    expect(mockContext.createScriptProcessor).toHaveBeenCalledWith(4096, 1, 1)
    expect(mockSource.connect).toHaveBeenCalledWith(mockProcessor)
    expect(result.current.isRecording).toBe(true)
  })

  it('should stop recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    const onPcmData = vi.fn()

    await act(async () => {
      await result.current.startRecording(onPcmData)
    })

    act(() => {
      result.current.stopRecording()
    })

    expect(mockProcessor.disconnect).toHaveBeenCalled()
    expect(mockContext.close).toHaveBeenCalled()
    expect(result.current.isRecording).toBe(false)
  })

  it('should call onPcmData callback with base64 PCM data on audio process', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    const onPcmData = vi.fn()

    await act(async () => {
      await result.current.startRecording(onPcmData)
    })

    // Simulate audio processing event
    const float32Data = new Float32Array([0.5, -0.5, 0.25, -0.25])
    const fakeEvent = {
      inputBuffer: {
        getChannelData: vi.fn(() => float32Data),
      },
    } as unknown as AudioProcessingEvent

    act(() => {
      if (mockProcessor.onaudioprocess) {
        mockProcessor.onaudioprocess(fakeEvent)
      }
    })

    expect(onPcmData).toHaveBeenCalledTimes(1)
    const base64 = onPcmData.mock.calls[0][0]
    expect(typeof base64).toBe('string')
    // Valid base64
    expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should convert float32 to int16 PCM correctly', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    const onPcmData = vi.fn()

    await act(async () => {
      await result.current.startRecording(onPcmData)
    })

    // Single sample at maximum positive value
    const float32Data = new Float32Array([1.0])
    const fakeEvent = {
      inputBuffer: {
        getChannelData: vi.fn(() => float32Data),
      },
    } as unknown as AudioProcessingEvent

    act(() => {
      if (mockProcessor.onaudioprocess) {
        mockProcessor.onaudioprocess(fakeEvent)
      }
    })

    const base64 = onPcmData.mock.calls[0][0]
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const int16 = new Int16Array(bytes.buffer)
    // 1.0 * 0x7fff = 32767
    expect(int16[0]).toBe(0x7fff)
  })

  it('should throw error when getUserMedia fails', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    })

    const { result } = renderHook(() => useAudioRecorder())

    await expect(
      act(async () => {
        await result.current.startRecording(vi.fn())
      })
    ).rejects.toThrow('Permission denied')
  })

  it('should stop cleanly when not recording', () => {
    const { result } = renderHook(() => useAudioRecorder())

    // Calling stopRecording without starting should not throw
    act(() => {
      result.current.stopRecording()
    })

    expect(result.current.isRecording).toBe(false)
  })

  it('should stop all media tracks when stopRecording is called', async () => {
    const mockTrack = { stop: vi.fn() }
    mockStream.getTracks.mockReturnValue([mockTrack])

    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording(vi.fn())
    })

    act(() => {
      result.current.stopRecording()
    })

    expect(mockTrack.stop).toHaveBeenCalled()
  })
})
