# 费曼学习法 Audio2Audio TDD 测试计划

> **Goal:** 为每个模块编写测试，先写测试，观察失败，实现代码，让测试通过

---

## 测试技术栈

| 层级 | 测试框架 |
|------|---------|
| 前端 | Vitest + React Testing Library |
| 后端 | Vitest (Node.js) |
| 组件测试 | @testing-library/react |
| WebSocket 测试 | mock ws |

---

## 测试套件划分（可并行）

### Suite 1: 后端核心逻辑 (backend)

| 测试文件 | 被测模块 | 测试内容 |
|---------|---------|---------|
| `session-manager.test.ts` | SessionManager | 创建/获取/更新/删除会话 |
| `understanding-judge.test.ts` | understanding-judge | 解析 AI 回复，更新理解度 |
| `proxy-handler.test.ts` | ProxyHandler | WebSocket 消息转发 |
| `ws-server.test.ts` | FeynmanWSServer | 连接管理，消息路由 |

### Suite 2: 前端状态管理 (frontend)

| 测试文件 | 被测模块 | 测试内容 |
|---------|---------|---------|
| `sessionStore.test.ts` | sessionStore | 所有状态和 action |
| `useWebSocket.test.ts` | useWebSocket | 连接/断开/消息处理 |

### Suite 3: 前端组件 (frontend)

| 测试文件 | 被测模块 | 测试内容 |
|---------|---------|---------|
| `pages/HomePage.test.tsx` | HomePage | 渲染，按钮导航 |
| `pages/CreateTaskPage.test.tsx` | CreateTaskPage | 表单输入，sessionStorage |
| `pages/SessionPage.test.tsx` | SessionPage | 状态显示，组件集成 |
| `pages/ResultPage.test.tsx` | ResultPage | 结果展示，重置逻辑 |
| `components/UnderstandingTracker.test.tsx` | UnderstandingTracker | 进度条，点位显示 |
| `components/ConversationBubble.test.tsx` | ConversationBubble | 消息气泡渲染 |
| `components/AudioRecorder.test.tsx` | AudioRecorder | 按钮状态切换 |
| `components/AudioPlayer.test.tsx` | AudioPlayer | 音频播放逻辑 |

---

## 详细测试用例

### Suite 1: SessionManager (backend/src/session-manager.ts)

```typescript
// session-manager.test.ts

describe('SessionManager', () => {
  let manager: SessionManager

  beforeEach(() => {
    manager = new SessionManager()
  })

  test('createSession creates a new session with correct defaults', () => {
    const session = manager.createSession('题目内容', '数学')

    expect(session.id).toMatch(/^session_/)
    expect(session.state).toBe('idle')
    expect(session.problemText).toBe('题目内容')
    expect(session.subject).toBe('数学')
    expect(session.understandingLevel).toBe(0)
    expect(session.understoodPoints).toEqual([])
    expect(session.unclearPoints).toEqual([])
  })

  test('getSession returns session by id', () => {
    const created = manager.createSession('题目', '物理')
    const retrieved = manager.getSession(created.id)

    expect(retrieved).toEqual(created)
  })

  test('getSession returns undefined for non-existent id', () => {
    const result = manager.getSession('non-existent-id')

    expect(result).toBeUndefined()
  })

  test('updateSession updates session fields', () => {
    const session = manager.createSession('题目', '数学')
    const updated = manager.updateSession(session.id, {
      state: 'listening',
      understandingLevel: 50,
      understoodPoints: ['题目目标'],
    })

    expect(updated?.state).toBe('listening')
    expect(updated?.understandingLevel).toBe(50)
    expect(updated?.understoodPoints).toEqual(['题目目标'])
  })

  test('deleteSession removes session', () => {
    const session = manager.createSession('题目', '数学')
    manager.deleteSession(session.id)

    expect(manager.getSession(session.id)).toBeUndefined()
  })
})
```

### Suite 2: Understanding Judge (backend/src/understanding-judge.ts)

```typescript
// understanding-judge.test.ts

describe('UnderstandingJudge', () => {
  let judge: UnderstandingJudge

  beforeEach(() => {
    judge = new UnderstandingJudge()
  })

  describe('parseAIResponse', () => {
    test('identifies question type as unclear point', () => {
      const result = judge.parseAIResponse('这一步为什么可以这样做？')

      expect(result.type).toBe('question')
      expect(result.unclearPoint).toBe('为什么可以这样做')
    })

    test('identifies confirmation type', () => {
      const result = judge.parseAIResponse('你的意思是先列方程，再求解，对吗？')

      expect(result.type).toBe('confirmation')
    })

    test('identifies summary type', () => {
      const result = judge.parseAIResponse('我现在理解的是...你是先...再...最后...对吗？')

      expect(result.type).toBe('summary')
    })

    test('identifies encouragement type', () => {
      const result = judge.parseAIResponse('我跟上了，你继续')

      expect(result.type).toBe('encouragement')
    })
  })

  describe('updateUnderstanding', () => {
    test('increases understanding level on confirmation', () => {
      const session = { understandingLevel: 0 } as Session
      judge.updateUnderstanding(session, { type: 'confirmation' })

      expect(session.understandingLevel).toBeGreaterThan(0)
    })

    test('adds understood point on summary confirmation', () => {
      const session = { understoodPoints: [], unclearPoints: ['为什么用这个方法'] } as Session
      judge.updateUnderstanding(session, { type: 'summary_confirmed' })

      expect(session.understoodPoints).toContain('为什么用这个方法')
      expect(session.unclearPoints).not.toContain('为什么用这个方法')
    })
  })

  describe('isFullyUnderstood', () => {
    test('returns true when understanding level >= 80 and no unclear points', () => {
      const session = {
        understandingLevel: 80,
        unclearPoints: [],
      } as Session

      expect(judge.isFullyUnderstood(session)).toBe(true)
    })

    test('returns false when unclear points remain', () => {
      const session = {
        understandingLevel: 90,
        unclearPoints: ['为什么选这个方法'],
      } as Session

      expect(judge.isFullyUnderstood(session)).toBe(false)
    })

    test('returns false when understanding level < 80', () => {
      const session = {
        understandingLevel: 70,
        unclearPoints: [],
      } as Session

      expect(judge.isFullyUnderstood(session)).toBe(false)
    })
  })
})
```

### Suite 3: ProxyHandler (backend/src/proxy-handler.ts)

```typescript
// proxy-handler.test.ts

describe('ProxyHandler', () => {
  // Mock WebSocket
  const mockClientWS = { send: jest.fn(), close: jest.fn() }
  const mockServerWS = { send: jest.fn(), close: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(WebSocket as jest.MockedClass<typeof WebSocket>).mockImplementation(() => mockServerWS as any)
  })

  describe('connect', () => {
    test('establishes connection to Qwen API', async () => {
      const handler = new ProxyHandler({
        sessionId: 'test-session',
        clientWs: mockClientWS as any,
        problemText: '题目',
        subject: '数学',
      })

      await handler.connect()

      expect(WebSocket).toHaveBeenCalledWith(
        'wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime',
        expect.any(Object)
      )
    })

    test('sends session config after connection', async () => {
      const handler = new ProxyHandler({
        sessionId: 'test-session',
        clientWs: mockClientWS as any,
        problemText: '求这道题怎么解',
        subject: '数学',
      })

      await handler.connect()

      expect(mockServerWS.send).toHaveBeenCalledWith(
        expect.stringContaining('session.update')
      )
    })
  })

  describe('handleClientMessage', () => {
    test('forwards audio buffer append to server', async () => {
      const handler = new ProxyHandler({
        sessionId: 'test-session',
        clientWs: mockClientWS as any,
        problemText: '题目',
        subject: '数学',
      })

      await handler.connect()
      handler.handleClientMessage(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: 'base64-audio-data',
      }))

      expect(mockServerWS.send).toHaveBeenCalledWith(
        expect.stringContaining('input_audio_buffer.append')
      )
    })

    test('cancels response on speech_started when responding', async () => {
      const handler = new ProxyHandler({
        sessionId: 'test-session',
        clientWs: mockClientWS as any,
        problemText: '题目',
        subject: '数学',
      })

      await handler.connect()
      // Simulate responding state
      ;(handler as any).isResponsing = true

      handler.handleClientMessage(JSON.stringify({
        type: 'input_audio_buffer.speech_started',
      }))

      expect(mockServerWS.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'response.cancel' })
      )
    })
  })
})
```

### Suite 4: sessionStore (frontend/src/stores/sessionStore.ts)

```typescript
// sessionStore.test.ts

import { useSessionStore } from './sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSessionStore.getState().reset()
  })

  test('has correct initial state', () => {
    const state = useSessionStore.getState()

    expect(state.sessionId).toBeNull()
    expect(state.state).toBe('idle')
    expect(state.problemText).toBe('')
    expect(state.subject).toBe('数学')
    expect(state.messages).toEqual([])
    expect(state.understandingLevel).toBe(0)
    expect(state.understoodPoints).toEqual([])
    expect(state.unclearPoints).toEqual([])
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
    expect(useSessionStore.getState().messages[0]).toEqual(message)
  })

  test('addUnderstoodPoint deduplicates', () => {
    const store = useSessionStore.getState()
    store.addUnderstoodPoint('题目目标')
    store.addUnderstoodPoint('题目目标') // duplicate

    expect(store.understoodPoints).toEqual(['题目目标'])
  })

  test('addUnderstoodPoint removes from unclearPoints', () => {
    const store = useSessionStore.getState()
    store.addUnclearPoint('为什么用这个方法')
    store.addUnderstoodPoint('为什么用这个方法')

    expect(store.understoodPoints).toContain('为什么用这个方法')
    expect(store.unclearPoints).not.toContain('为什么用这个方法')
  })

  test('addUnclearPoint deduplicates', () => {
    const store = useSessionStore.getState()
    store.addUnclearPoint('某一步')
    store.addUnclearPoint('某一步') // duplicate

    expect(store.unclearPoints).toEqual(['某一步'])
  })

  test('removeUnclearPoint removes specific point', () => {
    const store = useSessionStore.getState()
    store.addUnclearPoint('点1')
    store.addUnclearPoint('点2')
    store.removeUnclearPoint('点1')

    expect(store.unclearPoints).toEqual(['点2'])
  })

  test('setUnderstandingLevel updates level', () => {
    useSessionStore.getState().setUnderstandingLevel(75)

    expect(useSessionStore.getState().understandingLevel).toBe(75)
  })

  test('reset restores initial state', () => {
    const store = useSessionStore.getState()
    store.setSessionId('session-123')
    store.setState('connecting')
    store.addMessage({
      id: 'msg-1',
      role: 'user',
      content: 'test',
      timestamp: new Date(),
    })

    store.reset()

    const newState = useSessionStore.getState()
    expect(newState.sessionId).toBeNull()
    expect(newState.state).toBe('idle')
    expect(newState.messages).toEqual([])
  })
})
```

### Suite 5: useWebSocket (frontend/src/hooks/useWebSocket.ts)

```typescript
// useWebSocket.test.ts

import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

// Mock WebSocket
const mockSend = jest.fn()
const mockClose = jest.fn()
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: mockSend,
  close: mockClose,
  readyState: 1, // OPEN
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
})) as any

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockClear()
  })

  test('connect establishes WebSocket connection', async () => {
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      result.current.connect()
    })

    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3000')
  })

  test('connect sends session.init message', async () => {
    useWebSocket.setState({
      problemText: '测试题目',
      subject: '数学',
    })

    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      result.current.connect()
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.stringContaining('session.init')
    )
    expect(mockSend).toHaveBeenCalledWith(
      expect.stringContaining('测试题目')
    )
  })

  test('disconnect closes WebSocket', async () => {
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      result.current.connect()
    })

    await act(async () => {
      result.current.disconnect()
    })

    expect(mockClose).toHaveBeenCalled()
  })

  test('handles session.created event', async () => {
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      result.current.connect()
    })

    // Simulate server response
    const wsInstance = (WebSocket as jest.Mock).mock.results[0].value
    await act(async () => {
      wsInstance.onmessage({ data: JSON.stringify({ type: 'session.created', sessionId: 'new-session' }) })
    })

    expect(useWebSocket.getState().sessionId).toBe('new-session')
    expect(useWebSocket.getState().state).toBe('listening')
  })

  test('handles response.audio_transcript.delta event', async () => {
    const { result } = renderHook(() => useWebSocket())

    await act(async () => {
      result.current.connect()
    })

    const wsInstance = (WebSocket as jest.Mock).mock.results[0].value
    await act(async () => {
      wsInstance.onmessage({ data: JSON.stringify({ type: 'response.audio_transcript.delta', delta: '你说' }) })
    })

    expect(useWebSocket.getState().currentTranscript).toContain('你说')
  })
})
```

### Suite 6: Components

```typescript
// components/UnderstandingTracker.test.tsx

import { render, screen } from '@testing-library/react'
import { UnderstandingTracker } from './UnderstandingTracker'
import { useSessionStore } from '../stores/sessionStore'

describe('UnderstandingTracker', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  test('renders progress bar with correct width', () => {
    useSessionStore.getState().setUnderstandingLevel(60)

    render(<UnderstandingTracker />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar.style.width).toBe('60%')
  })

  test('displays understood points with checkmarks', () => {
    useSessionStore.getState().addUnderstoodPoint('题目目标')
    useSessionStore.getState().addUnderstoodPoint('主解法')

    render(<UnderstandingTracker />)

    expect(screen.getByText('题目目标')).toBeInTheDocument()
    expect(screen.getByText('主解法')).toBeInTheDocument()
    expect(screen.queryAllByText('✓')).toHaveLength(2)
  })

  test('displays unclear points with question marks', () => {
    useSessionStore.getState().addUnclearPoint('为什么用这个方法')
    useSessionStore.getState().addUnclearPoint('最后一步')

    render(<UnderstandingTracker />)

    expect(screen.getByText('为什么用这个方法')).toBeInTheDocument()
    expect(screen.queryAllByText('?')).toHaveLength(2)
  })

  test('shows placeholder when no points', () => {
    render(<UnderstandingTracker />)

    expect(screen.getByText('等待开始讲解...')).toBeInTheDocument()
  })
})
```

---

## 测试执行策略

### 并行化方案

由于各个测试套件之间没有依赖关系，可以完全并行执行：

| Worktree | Suite | 测试范围 |
|---------|-------|---------|
| `worktrees/test-backend` | Suite 1 | backend 核心逻辑 |
| `worktrees/test-frontend-store` | Suite 2 | sessionStore + useWebSocket |
| `worktrees/test-frontend-components` | Suite 3 | 前端组件 |

### 执行顺序

1. **每个 worktree 独立执行 TDD 循环**
2. **RED** → 写测试，观察失败
3. **GREEN** → 实现最小代码，让测试通过
4. **REFACTOR** → 重构优化
5. **合并回 main**

---

## 验收标准

- [ ] 所有测试套件通过
- [ ] 每个模块都有测试覆盖
- [ ] TDD 循环被遵守（先写测试，再实现）
- [ ] 测试名称清晰，描述行为
- [ ] 无 mocking 过度（除非必要）
- [ ] 边界情况被覆盖
