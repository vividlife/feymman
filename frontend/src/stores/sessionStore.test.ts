import { useSessionStore } from './sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  test('has correct initial state', () => {
    const state = useSessionStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.state).toBe('idle')
    expect(state.problemText).toBe('')
    expect(state.messages).toEqual([])
    expect(state.understandingLevel).toBe(0)
  })

  test('setSessionId updates sessionId', () => {
    useSessionStore.getState().setSessionId('session-123')
    expect(useSessionStore.getState().sessionId).toBe('session-123')
  })

  test('setState updates state', () => {
    useSessionStore.getState().setState('connecting')
    expect(useSessionStore.getState().state).toBe('connecting')
  })

  test('addMessage appends message', () => {
    const message = {
      id: 'msg-1',
      role: 'user' as const,
      content: '你好',
      timestamp: new Date(),
    }
    useSessionStore.getState().addMessage(message)
    expect(useSessionStore.getState().messages).toHaveLength(1)
  })

  test('addUnderstoodPoint deduplicates', () => {
    useSessionStore.getState().addUnderstoodPoint('题目目标')
    useSessionStore.getState().addUnderstoodPoint('题目目标')
    expect(useSessionStore.getState().understoodPoints).toEqual(['题目目标'])
  })

  test('addUnderstoodPoint removes from unclearPoints', () => {
    useSessionStore.getState().addUnclearPoint('某个点')
    useSessionStore.getState().addUnderstoodPoint('某个点')
    expect(useSessionStore.getState().understoodPoints).toContain('某个点')
    expect(useSessionStore.getState().unclearPoints).not.toContain('某个点')
  })

  test('addUnclearPoint deduplicates', () => {
    useSessionStore.getState().addUnclearPoint('点1')
    useSessionStore.getState().addUnclearPoint('点1')
    expect(useSessionStore.getState().unclearPoints).toEqual(['点1'])
  })

  test('removeUnclearPoint removes specific point', () => {
    useSessionStore.getState().addUnclearPoint('点1')
    useSessionStore.getState().addUnclearPoint('点2')
    useSessionStore.getState().removeUnclearPoint('点1')
    expect(useSessionStore.getState().unclearPoints).toEqual(['点2'])
  })

  test('setUnderstandingLevel updates level', () => {
    useSessionStore.getState().setUnderstandingLevel(75)
    expect(useSessionStore.getState().understandingLevel).toBe(75)
  })

  test('reset restores initial state', () => {
    const store = useSessionStore.getState()
    store.setSessionId('session-123')
    store.setState('connecting')
    store.reset()
    const newState = useSessionStore.getState()
    expect(newState.sessionId).toBeNull()
    expect(newState.state).toBe('idle')
  })
})