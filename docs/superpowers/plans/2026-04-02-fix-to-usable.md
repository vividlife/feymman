# Feymman Fix-to-Usable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical/important issues from code review to make the app functional end-to-end: user enters a problem, records audio, audio gets converted to PCM and sent to Qwen via WebSocket, AI responds with audio+text, conversation displays in real time, speech interruption works.

**Architecture:** Backend is a WebSocket proxy between browser and Qwen realtime API. Frontend is a React SPA with Zustand state management. The key data flow is: mic -> WebM -> PCM conversion -> base64 -> WS -> backend proxy -> Qwen -> response events -> WS -> frontend display. We use server-side VAD so Qwen auto-detects speech boundaries.

**Tech Stack:** React 18, Zustand, Vite, TypeScript, Express, ws, Qwen3.5-Omni Realtime API

---

## File Map

| File | Responsibility | Action |
|------|---------------|--------|
| `backend/src/proxy-handler.ts` | Proxy WS messages between client and Qwen | Modify: remove credential logging, fix `isResponsing`, add audio playback forwarding |
| `backend/src/ws-server.ts` | Accept client WS connections, route to proxy | No change needed |
| `backend/src/understanding-judge.ts` | Dead code | Delete |
| `backend/src/session-manager.ts` | Session state | No change needed |
| `frontend/src/components/AudioRecorder.tsx` | Mic button UI | Modify: fix props interface to match SessionPage usage |
| `frontend/src/hooks/useAudioRecorder.ts` | Mic recording hook | Modify: add real-time PCM streaming instead of record-then-send |
| `frontend/src/hooks/useWebSocket.ts` | WS connection & messaging | Modify: use env var for URL, add audio output handling |
| `frontend/src/pages/SessionPage.tsx` | Main session page | Modify: fix useEffect deps, fix AudioRecorder integration, add audio playback |
| `frontend/src/pages/CreateTaskPage.tsx` | Task creation | Modify: use Zustand store instead of sessionStorage |
| `frontend/src/pages/ResultPage.tsx` | Results display | Modify: show actual conversation data |
| `frontend/src/stores/sessionStore.ts` | Zustand state | Modify: add audio output state |
| `frontend/src/lib/audioUtils.ts` | Audio format conversion | Keep as-is (already correct) |
| `frontend/vite.config.ts` | Vite config | Modify: fix proxy port |
| `shared/lib/utils.ts` | Orphaned utils | Delete |

---

### Task 1: Fix Security — Remove Credential Logging

**Files:**
- Modify: `backend/src/proxy-handler.ts:37,44`

- [ ] **Step 1: Remove API key logging from proxy-handler**

In `backend/src/proxy-handler.ts`, replace lines 37 and 44:

```typescript
// REMOVE these two lines:
console.log('[ProxyHandler] API Key loaded:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT LOADED')
// ...
console.log('[ProxyHandler] Headers:', JSON.stringify(headers))

// REPLACE with:
console.log('[ProxyHandler] API Key configured:', !!apiKey)
```

Also remove the `console.log` on line 44 entirely (the one that logs headers).

- [ ] **Step 2: Verify backend still starts**

Run: `cd /Users/huangrongsheng/Work/feymman/backend && npx tsx src/index.ts &` then kill it.
Expected: Starts without error, logs "API Key configured: true" (not the actual key).

- [ ] **Step 3: Commit**

```bash
git add backend/src/proxy-handler.ts
git commit -m "fix(security): remove API key logging from proxy-handler"
```

---

### Task 2: Fix Backend — `isResponsing` and Audio Forwarding

**Files:**
- Modify: `backend/src/proxy-handler.ts:108-117`

The `forwardToClient` method currently just forwards raw JSON. It needs to:
1. Track `isResponsing` state by detecting `response.created` and `response.done` events
2. Forward audio delta events properly to the client

- [ ] **Step 1: Update forwardToClient to track response state**

Replace the `forwardToClient` method in `backend/src/proxy-handler.ts`:

```typescript
forwardToClient(data: unknown): void {
  if (this.clientWs.readyState !== WebSocket.OPEN) return

  try {
    const event = JSON.parse(data as string)

    // Track responding state for speech interruption
    if (event.type === 'response.created') {
      this.isResponsing = true
    } else if (event.type === 'response.done') {
      this.isResponsing = false
    }

    this.clientWs.send(JSON.stringify(event))
  } catch {
    this.clientWs.send(data as string)
  }
}
```

- [ ] **Step 2: Verify the change compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/backend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/proxy-handler.ts
git commit -m "fix(backend): track isResponsing state for speech interruption"
```

---

### Task 3: Fix AudioRecorder Component — Props Mismatch

**Files:**
- Modify: `frontend/src/components/AudioRecorder.tsx`

SessionPage passes `isRecording` and `onToggleRecording` props but the component defines `onAudioData` and `disabled`. The component also creates its own `useAudioRecorder` hook instance, competing with the one in SessionPage.

Fix: Make AudioRecorder a controlled, presentational component. It receives `isRecording` and `onToggleRecording` from the parent — no internal hook.

- [ ] **Step 1: Rewrite AudioRecorder as a controlled component**

Replace `frontend/src/components/AudioRecorder.tsx` entirely:

```tsx
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  isRecording: boolean
  onToggleRecording: () => void
  disabled?: boolean
}

export default function AudioRecorder({ isRecording, onToggleRecording, disabled }: AudioRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className="w-32 h-32 rounded-full"
        onClick={onToggleRecording}
        disabled={disabled}
      >
        {isRecording ? '停止' : '开始说'}
      </Button>
      <p className="text-gray-500 text-sm">
        {isRecording ? '正在收音... 点击停止发送' : '点击开始讲解'}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit`
Expected: No errors (SessionPage already passes `isRecording` and `onToggleRecording`).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AudioRecorder.tsx
git commit -m "fix(frontend): make AudioRecorder a controlled component matching SessionPage props"
```

---

### Task 4: Fix Audio Pipeline — Real-time PCM Streaming

**Files:**
- Modify: `frontend/src/hooks/useAudioRecorder.ts`
- Modify: `frontend/src/pages/SessionPage.tsx`

The current design records a full WebM blob then sends it as base64. But Qwen expects real-time PCM audio streamed via `input_audio_buffer.append`. With server-side VAD, Qwen auto-detects speech end and triggers response — no manual commit needed.

Fix: Use `AudioWorklet` or `ScriptProcessorNode` to capture raw PCM in real-time and stream it via WebSocket.

- [ ] **Step 1: Rewrite useAudioRecorder for real-time PCM streaming**

Replace `frontend/src/hooks/useAudioRecorder.ts`:

```typescript
import { useState, useRef, useCallback } from 'react'

export interface UseAudioRecorderReturn {
  isRecording: boolean
  startRecording: (onPcmData: (base64: string) => void) => Promise<void>
  stopRecording: () => void
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const startRecording = useCallback(async (onPcmData: (base64: string) => void) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    streamRef.current = stream

    const context = new AudioContext({ sampleRate: 16000 })
    contextRef.current = context

    const source = context.createMediaStreamSource(stream)
    // Buffer size 4096 at 16kHz = ~256ms chunks
    const processor = context.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0)
      // Convert float32 [-1,1] to int16 PCM
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      // Convert to base64
      const bytes = new Uint8Array(int16.buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      onPcmData(btoa(binary))
    }

    source.connect(processor)
    processor.connect(context.destination)
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    contextRef.current?.close()
    contextRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsRecording(false)
  }, [])

  return { isRecording, startRecording, stopRecording }
}
```

- [ ] **Step 2: Update SessionPage to use real-time streaming**

Replace the `handleToggleRecording` function and related code in `frontend/src/pages/SessionPage.tsx`:

```tsx
import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import AudioRecorder from '@/components/AudioRecorder'
import UnderstandingTracker from '@/components/UnderstandingTracker'
import ConversationBubble from '@/components/ConversationBubble'
import { Button } from '@/components/ui/button'

export default function SessionPage() {
  const navigate = useNavigate()

  const {
    sessionId,
    state,
    problemText,
    subject,
    messages,
    currentTranscript,
    setProblemText,
    setSubject,
  } = useSessionStore()

  const { connect, disconnect, sendAudioMessage } = useWebSocket()
  const { isRecording, startRecording, stopRecording } = useAudioRecorder()

  // Load from Zustand store (set by CreateTaskPage)
  // Auto-connect when problemText is available
  useEffect(() => {
    if (!sessionId && problemText) {
      connect()
    }
  }, [sessionId, problemText, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording((pcmBase64) => {
        sendAudioMessage(pcmBase64)
      })
    }
  }, [isRecording, startRecording, stopRecording, sendAudioMessage])

  const handleEnd = useCallback(() => {
    stopRecording()
    disconnect()
    navigate('/result')
  }, [stopRecording, disconnect, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">{subject}</span>
              <h2 className="font-medium line-clamp-1">{problemText}</h2>
            </div>
            <span className="text-sm text-blue-500">
              {state === 'listening' && '等待你讲解...'}
              {state === 'responding' && 'AI 回复中...'}
              {state === 'connecting' && '连接中...'}
              {state === 'idle' && '未连接'}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 container mx-auto max-w-2xl p-4 overflow-y-auto">
        <div className="space-y-4 mb-4">
          {messages.map((msg) => (
            <ConversationBubble key={msg.id} message={msg} />
          ))}
        </div>
        {currentTranscript && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">{currentTranscript}</p>
              <p className="text-xs text-gray-400 mt-1">AI 回复中...</p>
            </div>
          </div>
        )}
      </div>

      {/* Understanding tracker */}
      <div className="container mx-auto max-w-2xl px-4">
        <UnderstandingTracker />
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-2xl flex justify-center gap-4">
          <AudioRecorder
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            disabled={state !== 'listening' && state !== 'responding' && !isRecording}
          />
          <Button variant="outline" onClick={handleEnd}>
            结束本轮
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Remove `commitAudio` from useWebSocket (no longer needed with server VAD)**

In `frontend/src/hooks/useWebSocket.ts`, remove the `commitAudio` function and its return value. The server VAD auto-detects speech end.

- [ ] **Step 4: Verify frontend compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useAudioRecorder.ts frontend/src/pages/SessionPage.tsx frontend/src/hooks/useWebSocket.ts
git commit -m "feat: real-time PCM audio streaming to Qwen via ScriptProcessorNode"
```

---

### Task 5: Fix WebSocket — Add Audio Output Playback and Env Var URL

**Files:**
- Modify: `frontend/src/hooks/useWebSocket.ts`
- Modify: `frontend/src/stores/sessionStore.ts`

The frontend receives `response.audio.delta` events with PCM audio data but currently ignores them. We need to play them back. Also fix the hardcoded WebSocket URL.

- [ ] **Step 1: Add audio playback queue to sessionStore**

Add to `frontend/src/stores/sessionStore.ts` in the interface and initial state:

```typescript
// Add to SessionStore interface:
audioQueue: string[]  // base64 PCM chunks to play
addAudioChunk: (chunk: string) => void
clearAudioQueue: () => void
```

```typescript
// Add to initialState:
audioQueue: [],

// Add to store actions:
addAudioChunk: (chunk) =>
  set((state) => ({
    audioQueue: [...state.audioQueue, chunk],
  })),
clearAudioQueue: () => set({ audioQueue: [] }),
```

- [ ] **Step 2: Update useWebSocket to handle audio output and use env var**

In `frontend/src/hooks/useWebSocket.ts`:

1. Change the URL to use env var:
```typescript
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8082'
const ws = new WebSocket(wsUrl)
```

2. Add a case for `response.audio.delta` in the switch:
```typescript
case 'response.audio.delta':
  useSessionStore.getState().addAudioChunk(data.delta)
  break
```

3. Remove the `commitAudio` function entirely and remove it from the return value.

- [ ] **Step 3: Add audio playback hook to SessionPage**

Add a `useEffect` in `SessionPage` that plays PCM audio chunks from the queue:

```typescript
// Audio playback
const audioContextRef = useRef<AudioContext | null>(null)
const { audioQueue, clearAudioQueue } = useSessionStore()

useEffect(() => {
  if (audioQueue.length === 0) return

  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 })
  }
  const ctx = audioContextRef.current

  const chunks = [...audioQueue]
  clearAudioQueue()

  for (const chunk of chunks) {
    // Decode base64 to PCM int16
    const binary = atob(chunk)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.getChannelData(0).set(float32)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start()
  }
}, [audioQueue, clearAudioQueue])
```

Note: Qwen outputs PCM at 24kHz (the default output sample rate).

- [ ] **Step 4: Verify frontend compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useWebSocket.ts frontend/src/stores/sessionStore.ts frontend/src/pages/SessionPage.tsx
git commit -m "feat: add audio output playback and configurable WS URL"
```

---

### Task 6: Fix CreateTaskPage — Use Zustand Instead of sessionStorage

**Files:**
- Modify: `frontend/src/pages/CreateTaskPage.tsx`
- Modify: `frontend/src/pages/SessionPage.tsx`

CreateTaskPage currently writes to `sessionStorage`. SessionPage reads from `sessionStorage` into Zustand. Fix: CreateTaskPage writes directly to Zustand store.

- [ ] **Step 1: Update CreateTaskPage to use Zustand store**

Replace the `handleStart` function and add store import in `frontend/src/pages/CreateTaskPage.tsx`:

```typescript
import { useSessionStore } from '@/stores/sessionStore'

// Inside component:
const { setProblemText: setStoreProblem, setSubject: setStoreSubject, setGoal: setStoreGoal } = useSessionStore()

const handleStart = () => {
  if (!problemText.trim()) return
  setStoreProblem(problemText)
  setStoreSubject(subject)
  setStoreGoal(goal)
  navigate('/session')
}
```

- [ ] **Step 2: Remove sessionStorage reads from SessionPage**

Remove the first `useEffect` in SessionPage that reads from `sessionStorage`:

```typescript
// DELETE this entire useEffect:
useEffect(() => {
  const savedProblem = sessionStorage.getItem('problemText')
  const savedSubject = sessionStorage.getItem('subject')
  if (savedProblem) setProblemText(savedProblem)
  if (savedSubject) setSubject(savedSubject)
}, [setProblemText, setSubject])
```

Also remove `setProblemText` and `setSubject` from the destructured store values in SessionPage since they're no longer needed there.

- [ ] **Step 3: Update ResultPage to clear store properly**

In `frontend/src/pages/ResultPage.tsx`, update `handleNewProblem`:

```typescript
const handleNewProblem = () => {
  reset()
  navigate('/create')
}
```

Remove the `sessionStorage.clear()` call.

- [ ] **Step 4: Verify frontend compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/CreateTaskPage.tsx frontend/src/pages/SessionPage.tsx frontend/src/pages/ResultPage.tsx
git commit -m "refactor: use Zustand store instead of sessionStorage for page data transfer"
```

---

### Task 7: Fix Vite Config and Clean Up Dead Code

**Files:**
- Modify: `frontend/vite.config.ts:16`
- Delete: `shared/lib/utils.ts`
- Delete: `backend/src/understanding-judge.ts`
- Delete: `backend/src/__tests__/understanding-judge.test.ts`

- [ ] **Step 1: Fix Vite proxy port**

In `frontend/vite.config.ts`, change `http://localhost:3001` to `http://localhost:8081`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
  },
},
```

- [ ] **Step 2: Delete orphaned files**

```bash
rm shared/lib/utils.ts
rmdir shared/lib 2>/dev/null
rmdir shared 2>/dev/null
rm backend/src/understanding-judge.ts
rm backend/src/__tests__/understanding-judge.test.ts
```

- [ ] **Step 3: Remove understanding-judge import from session-manager (if any)**

Check `backend/src/session-manager.ts` — it does not import understanding-judge, so no change needed.

- [ ] **Step 4: Verify both projects compile**

```bash
cd /Users/huangrongsheng/Work/feymman/backend && npx tsc --noEmit
cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: fix vite proxy port, remove dead code (understanding-judge, shared/utils)"
```

---

### Task 8: Fix ResultPage — Show Actual Conversation Summary

**Files:**
- Modify: `frontend/src/pages/ResultPage.tsx`

Replace hardcoded placeholder with actual conversation messages.

- [ ] **Step 1: Update ResultPage to show conversation summary**

In `frontend/src/pages/ResultPage.tsx`, add `messages` to the destructured store values and replace the hardcoded AI summary card:

```tsx
const { subject, understandingLevel, understoodPoints, unclearPoints, messages, reset } = useSessionStore()

// Replace the "AI 最终复述" Card:
{messages.length > 0 && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>对话回顾</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {messages.slice(-10).map((msg, i) => (
          <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>
            <span className="font-medium">{msg.role === 'user' ? '你: ' : 'AI: '}</span>
            {msg.content}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ResultPage.tsx
git commit -m "feat: show actual conversation history on result page"
```

---

### Task 9: Clean Up Console Logs

**Files:**
- Modify: `backend/src/proxy-handler.ts`
- Modify: `backend/src/ws-server.ts`
- Modify: `frontend/src/hooks/useWebSocket.ts`
- Modify: `frontend/src/hooks/useAudioRecorder.ts`
- Modify: `frontend/src/pages/SessionPage.tsx`

Replace excessive `console.log` with a debug-gated logger pattern.

- [ ] **Step 1: Add debug flag to backend**

In `backend/src/proxy-handler.ts`, add at top:

```typescript
const DEBUG = process.env.DEBUG === 'true'
```

Replace all `console.log('[ProxyHandler]` calls with:

```typescript
if (DEBUG) console.log('[ProxyHandler] ...')
```

Keep `console.error` calls as-is (those are important).

- [ ] **Step 2: Add debug flag to ws-server**

Same pattern in `backend/src/ws-server.ts`:

```typescript
const DEBUG = process.env.DEBUG === 'true'
```

Gate all `console.log` calls.

- [ ] **Step 3: Remove console.logs from frontend hooks**

In `frontend/src/hooks/useWebSocket.ts` and `frontend/src/hooks/useAudioRecorder.ts`, remove all `console.log` statements. Keep `console.error` statements.

- [ ] **Step 4: Verify both compile**

```bash
cd /Users/huangrongsheng/Work/feymman/backend && npx tsc --noEmit
cd /Users/huangrongsheng/Work/feymman/frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/proxy-handler.ts backend/src/ws-server.ts frontend/src/hooks/useWebSocket.ts frontend/src/hooks/useAudioRecorder.ts
git commit -m "chore: gate backend logs behind DEBUG flag, remove frontend console.logs"
```

---

### Task 10: End-to-End Smoke Test

- [ ] **Step 1: Start backend**

```bash
cd /Users/huangrongsheng/Work/feymman/backend && npx tsx src/index.ts
```

Expected: "HTTP Server running on port 8081" and "Feynman Backend started"

- [ ] **Step 2: Start frontend**

```bash
cd /Users/huangrongsheng/Work/feymman/frontend && npm run dev
```

Expected: Vite dev server on port 5173.

- [ ] **Step 3: Manual flow verification**

1. Open `http://localhost:5173`
2. Click "开始讲一题"
3. Enter a problem text, select subject, click "开始讲解"
4. SessionPage should show "连接中..." then "等待你讲解..."
5. Click mic button — should start recording (requires mic permission)
6. Speak — audio should stream to backend as PCM
7. Stop speaking — Qwen should respond with audio + transcript
8. Click "结束本轮" — should navigate to ResultPage with conversation history

- [ ] **Step 4: Run existing unit tests**

```bash
cd /Users/huangrongsheng/Work/feymman/frontend && npx vitest run
```

Note: Some existing tests for the old `useAudioRecorder` interface will need updating since we changed the API. Fix any failing tests to match the new interface.

- [ ] **Step 5: Final commit if test fixes needed**

```bash
git add -A
git commit -m "test: update tests for new audio recorder interface"
```
