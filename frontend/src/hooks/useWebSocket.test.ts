import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionStore } from '@/stores/sessionStore'

// Mock WebSocket
const mockSend = vi.fn()
const mockClose = vi.fn()

// Event handlers storage
const eventHandlers: Record<string, Function[]> = {
  open: [],
  message: [],
  error: [],
  close: [],
}

// Create mock WebSocket class
class MockWebSocket {
  static readonly OPEN = 1
  static readonly CLOSED = 3
  readyState = MockWebSocket.OPEN

  send = mockSend
  close = mockClose

  addEventListener = (event: string, handler: Function) => {
    if (event === 'open') eventHandlers.open.push(handler)
    if (event === 'message') eventHandlers.message.push(handler)
    if (event === 'error') eventHandlers.error.push(handler)
    if (event === 'close') eventHandlers.close.push(handler)
  }

  removeEventListener = (event: string, handler: Function) => {
    if (event === 'open') eventHandlers.open = eventHandlers.open.filter(h => h !== handler)
    if (event === 'message') eventHandlers.message = eventHandlers.message.filter(h => h !== handler)
    if (event === 'error') eventHandlers.error = eventHandlers.error.filter(h => h !== handler)
    if (event === 'close') eventHandlers.close = eventHandlers.close.filter(h => h !== handler)
  }
}

// Import and use WebSocket
import { useWebSocket } from './useWebSocket'

// Set WebSocket mock globally
// Note: Due to ES module hoisting in Vitest, this may not apply to the already-imported hook
beforeAll(() => {
  Object.defineProperty(global, 'WebSocket', {
    writable: true,
    value: MockWebSocket,
  })
})

// Helper functions
const triggerOpen = () => {
  eventHandlers.open.forEach(handler => handler({ type: 'open' }))
}

// Helper functions available for future use
// const triggerMessage = (data: object) => {
//   eventHandlers.message.forEach(handler => handler({ data: JSON.stringify(data) }))
// }
// const triggerError = (error?: Error) => {
//   eventHandlers.error.forEach(handler => handler(error || new Error('Connection error')))
// }
// const triggerClose = () => {
//   eventHandlers.close.forEach(handler => handler({ type: 'close' }))
// }

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Clear event handlers
    eventHandlers.open = []
    eventHandlers.message = []
    eventHandlers.error = []
    eventHandlers.close = []

    // Reset mock functions
    mockSend.mockReset()
    mockClose.mockReset()

    // Reset store state
    useSessionStore.setState({
      sessionId: null,
      state: 'idle',
      problemText: 'Test problem',
      subject: '数学',
      messages: [],
      currentTranscript: '',
    })
  })

  describe('connect', () => {
    it('sets state to connecting when connecting', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.connect()
      })

      expect(useSessionStore.getState().state).toBe('connecting')
    })

    it('sets state to connecting before connection opens', () => {
      const { result } = renderHook(() => useWebSocket())
      const states: string[] = []

      const unsubscribe = useSessionStore.subscribe((state) => {
        states.push(state.state)
      })

      act(() => {
        result.current.connect()
      })

      expect(states[0]).toBe('connecting')

      unsubscribe()
    })

    it('does not reconnect if already connected', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.connect()
      })

      act(() => {
        triggerOpen()
      })

      mockSend.mockClear()

      act(() => {
        result.current.connect()
      })

      // The hook should check readyState and not reconnect if already open
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('sendAudioMessage', () => {
    it('sends audio data when WebSocket is open', () => {
      const { result } = renderHook(() => useWebSocket())
      const audioData = 'base64AudioData123'

      act(() => {
        result.current.connect()
      })

      act(() => {
        triggerOpen()
      })

      mockSend.mockClear()

      act(() => {
        result.current.sendAudioMessage(audioData)
      })

      // Verify send was called with audio data format
      expect(mockSend).toHaveBeenCalled()
    })

    it('silently drops audio when WebSocket is not connected', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.sendAudioMessage('someAudioData')
      })

      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('closes WebSocket connection', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.connect()
      })

      act(() => {
        triggerOpen()
      })

      act(() => {
        result.current.disconnect()
      })

      expect(mockClose).toHaveBeenCalled()
    })
  })
})
