# 费曼学习法 Audio2Audio 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个基于 Qwen3.5-Omni 实时语音的费曼学习法应用 MVP

**Architecture:** React + Vite 前端通过 WebSocket 与 Node.js 代理服务通信，代理服务透传音频流到 Qwen API。状态管理使用 Zustand，UI 使用 Tailwind + shadcn/ui。

**Tech Stack:** React + Vite + TypeScript + Zustand + Tailwind + shadcn/ui + Node.js + Express + ws + Qwen3.5-Omni API

---

## 目录结构

```
feymman/
├── frontend/                 # React + Vite 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui 组件
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── UnderstandingTracker.tsx
│   │   │   ├── ConversationBubble.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CreateTaskPage.tsx
│   │   │   ├── SessionPage.tsx
│   │   │   └── ResultPage.tsx
│   │   ├── stores/
│   │   │   └── sessionStore.ts   # Zustand store
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                  # Node.js 代理服务
│   ├── src/
│   │   ├── index.ts
│   │   ├── ws-server.ts
│   │   ├── proxy-handler.ts
│   │   └── session-manager.ts
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── ...
```

---

## Part 1: 项目初始化 (1 task)

### Task 1: 项目脚手架搭建

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: 创建 frontend 目录结构和基础配置文件**

```bash
mkdir -p frontend/src/{components/ui,pages,stores,hooks,lib}
touch frontend/src/main.tsx frontend/src/App.tsx frontend/src/index.css
```

`frontend/package.json`:
```json
{
  "name": "feynman-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^1.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
```

`frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
```

`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`frontend/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>费曼学习法 - 讲给 AI 听</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`frontend/src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`frontend/src/App.tsx`:
```typescript
import HomePage from './pages/HomePage'

function App() {
  return <HomePage />
}

export default App
```

- [ ] **Step 2: 创建 backend 目录结构和基础配置文件**

```bash
mkdir -p backend/src
touch backend/src/index.ts backend/src/ws-server.ts backend/src/proxy-handler.ts backend/src/session-manager.ts
```

`backend/package.json`:
```json
{
  "name": "feynman-backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "ws": "^8.18.0",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/ws": "^8.5.12",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.7.5",
    "typescript": "^5.6.3",
    "tsx": "^4.19.1"
  }
}
```

`backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建共享的工具函数**

`frontend/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

- [ ] **Step 4: 安装依赖**

Run: `cd frontend && npm install`
Run: `cd backend && npm install`

---

## Part 2: 后端开发 (1 task, 可独立开发)

### Task 2: WebSocket 代理服务

**Files:**
- Create: `backend/src/index.ts`
- Create: `backend/src/ws-server.ts`
- Create: `backend/src/proxy-handler.ts`
- Create: `backend/src/session-manager.ts`
- Create: `backend/.env.example`

- [ ] **Step 1: 创建 WebSocket 服务器和会话管理器**

`backend/src/session-manager.ts`:
```typescript
export type SessionState = 'idle' | 'listening' | 'responding' | 'completed' | 'error'

export interface Session {
  id: string
  state: SessionState
  createdAt: Date
  lastActivity: Date
  problemText: string
  subject: string
  understandingLevel: number // 0-100
  understoodPoints: string[]
  unclearPoints: string[]
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map()

  createSession(problemText: string, subject: string): Session {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const session: Session = {
      id,
      state: 'idle',
      createdAt: new Date(),
      lastActivity: new Date(),
      problemText,
      subject,
      understandingLevel: 0,
      understoodPoints: [],
      unclearPoints: [],
    }
    this.sessions.set(id, session)
    return session
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  updateSession(id: string, updates: Partial<Session>): Session | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    const updated = { ...session, ...updates, lastActivity: new Date() }
    this.sessions.set(id, updated)
    return updated
  }

  deleteSession(id: string): void {
    this.sessions.delete(id)
  }
}

export const sessionManager = new SessionManager()
```

- [ ] **Step 2: 创建代理处理器**

`backend/src/proxy-handler.ts`:
```typescript
import WebSocket from 'ws'
import { sessionManager } from './session-manager.js'

const QWEN_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime'

export interface ProxyHandlerOptions {
  sessionId: string
  clientWs: WebSocket
  problemText: string
  subject: string
  onSessionComplete?: (sessionId: string) => void
}

export class ProxyHandler {
  private sessionId: string
  private clientWs: WebSocket
  private serverWs: WebSocket | null = null
  private problemText: string
  private subject: string
  private onSessionComplete?: (sessionId: string) => void
  private isResponsing = false

  constructor(options: ProxyHandlerOptions) {
    this.sessionId = options.sessionId
    this.clientWs = options.clientWs
    this.problemText = options.problemText
    this.subject = options.subject
    this.onSessionComplete = options.onSessionComplete
  }

  async connect(): Promise<void> {
    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY not configured')
    }

    return new Promise((resolve, reject) => {
      this.serverWs = new WebSocket(QWEN_WS_URL, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      this.serverWs.on('open', () => {
        this.sendSessionConfig()
        resolve()
      })

      this.serverWs.on('message', (data) => {
        this.forwardToClient(data)
      })

      this.serverWs.on('error', (err) => {
        console.error('Server WS error:', err)
        reject(err)
      })

      this.serverWs.on('close', () => {
        this.clientWs.close()
      })
    })
  }

  private sendSessionConfig(): void {
    if (!this.serverWs || this.serverWs.readyState !== WebSocket.OPEN) return

    const systemPrompt = `你是一个正在被用户教学的学生型学习 Agent。
题目内容：${this.problemText}
学科：${this.subject}
你的目标是通过倾听、追问、澄清、复述和验证，判断自己是否已经被用户讲懂。
原则：
- 默认自己还没有完全理解
- 不要轻易说"我懂了"
- 优先通过提问来暴露自己没有理解的地方
- 如果用户只给结论、不解释原因，要继续追问
- 说话风格要像认真、诚实、会思考的学生，简洁自然，口语化`

    const config = {
      event_id: `event_${Date.now()}`,
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: 'Cherry',
        input_audio_format: 'pcm',
        output_audio_format: 'pcm',
        instructions: systemPrompt,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 800,
        },
      },
    }

    this.serverWs.send(JSON.stringify(config))
  }

  forwardToClient(data: unknown): void {
    if (this.clientWs.readyState !== WebSocket.OPEN) return

    try {
      const event = JSON.parse(data as string)
      this.clientWs.send(JSON.stringify(event))
    } catch {
      this.clientWs.send(data as string)
    }
  }

  handleClientMessage(data: unknown): void {
    if (!this.serverWs || this.serverWs.readyState !== WebSocket.OPEN) return

    try {
      const message = JSON.parse(data as string)
      // 处理打断
      if (message.type === 'input_audio_buffer.speech_started') {
        if (this.isResponsing) {
          this.serverWs.send(JSON.stringify({ type: 'response.cancel' }))
          this.isResponsing = false
        }
      }
      this.serverWs.send(data as string)
    } catch {
      this.serverWs.send(data as string)
    }
  }

  close(): void {
    if (this.serverWs) {
      this.serverWs.close()
      this.serverWs = null
    }
  }
}
```

- [ ] **Step 3: 创建 WebSocket 服务器**

`backend/src/ws-server.ts`:
```typescript
import { WebSocketServer, WebSocket } from 'ws'
import { ProxyHandler } from './proxy-handler.js'
import { sessionManager } from './session-manager.js'

export class FeynmanWSServer {
  private wss: WebSocketServer
  private proxies: Map<string, ProxyHandler> = new Map()

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.setup()
  }

  private setup(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      let sessionId: string | null = null

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())

          if (message.type === 'session.init') {
            // 初始化会话
            const { problemText, subject } = message
            const session = sessionManager.createSession(problemText, subject || '通用')
            sessionId = session.id

            // 创建代理处理器
            const proxy = new ProxyHandler({
              sessionId: session.id,
              clientWs: ws,
              problemText,
              subject,
              onSessionComplete: (sid) => {
                console.log(`Session ${sid} completed`)
              },
            })

            this.proxies.set(session.id, proxy)

            // 发送 session_id 给客户端
            ws.send(JSON.stringify({
              type: 'session.created',
              sessionId: session.id,
            }))

            // 连接 Qwen
            proxy.connect().catch((err) => {
              console.error('Failed to connect to Qwen:', err)
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to connect to AI service',
              }))
            })
          } else if (sessionId && this.proxies.has(sessionId)) {
            // 转发消息给 Qwen
            this.proxies.get(sessionId)!.handleClientMessage(data.toString())
          }
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      })

      ws.on('close', () => {
        if (sessionId) {
          this.proxies.get(sessionId)?.close()
          this.proxies.delete(sessionId)
        }
      })

      ws.on('error', (err) => {
        console.error('Client WS error:', err)
      })
    })
  }

  start(): void {
    console.log('Feynman WS Server running on port', (this.wss as any).address().port)
  }
}
```

- [ ] **Step 4: 创建主入口文件**

`backend/src/index.ts`:
```typescript
import express from 'express'
import cors from 'cors'
import { FeynmanWSServer } from './ws-server.js'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

// 启动 HTTP 服务器（预留后续 REST API）
const httpServer = app.listen(3001, () => {
  console.log('HTTP Server running on port 3001')
})

// 启动 WebSocket 服务器
const wsServer = new FeynmanWSServer(3000)
wsServer.start()

console.log('Feynman Backend started')
```

`backend/.env.example`:
```
DASHSCOPE_API_KEY=your_api_key_here
```

- [ ] **Step 5: 测试后端服务**

Run: `cd backend && npm run dev`
Expected: 输出 "Feynman Backend started" 和 "HTTP Server running on port 3001"

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: initial project setup and backend WebSocket proxy"
```

---

## Part 3: 前端页面开发 (4 tasks, 可并行)

### Task 3: HomePage 和 CreateTaskPage

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/CreateTaskPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建基础 UI 组件**

`frontend/src/components/ui/button.tsx`:
```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

`frontend/src/components/ui/card.tsx`:
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
```

- [ ] **Step 2: 创建 HomePage**

`frontend/src/pages/HomePage.tsx`:
```typescript
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* 主标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            把一道题讲给 AI 听，直到它真的听懂
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            基于费曼学习法的实时语音学习 Agent
          </p>
          <p className="text-gray-500">
            你负责讲，AI 负责听、追问，直到被你讲懂
          </p>
        </div>

        {/* 主入口 */}
        <div className="flex justify-center gap-4 mb-16">
          <Button size="lg" onClick={() => navigate('/create')}>
            开始讲一题
          </Button>
          <Button size="lg" variant="outline">
            体验示例
          </Button>
        </div>

        {/* 三步说明 */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">如何使用</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第一步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">选一道题，输入题目内容</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第二步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">开口讲给 AI 听，像教真人一样</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第三步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">直到 AI 真正被你讲懂</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 适用场景 */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">适用场景</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['数学题讲解', '物理解题思路', '错题复盘', '知识点口头讲解'].map((scene) => (
              <span
                key={scene}
                className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-700"
              >
                {scene}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建 CreateTaskPage**

`frontend/src/pages/CreateTaskPage.tsx`:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SUBJECTS = ['数学', '物理', '化学', '通用']
const GOALS = [
  { value: 'understand_how', label: '讲懂这道题怎么做' },
  { value: 'understand_why', label: '讲懂这道题为什么这么做' },
  { value: 'understand_concept', label: '讲懂某个知识点' },
]

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const [problemText, setProblemText] = useState('')
  const [subject, setSubject] = useState('数学')
  const [goal, setGoal] = useState('understand_how')

  const handleStart = () => {
    if (!problemText.trim()) return
    // 通过 sessionStorage 传递数据（简单方案）
    sessionStorage.setItem('problemText', problemText)
    sessionStorage.setItem('subject', subject)
    sessionStorage.setItem('goal', goal)
    navigate('/session')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">创建讲解任务</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>题目内容</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入或粘贴题目..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>学科</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-colors',
                    subject === s
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>讲解目标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <label key={g.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="goal"
                    value={g.value}
                    checked={goal === g.value}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 提示文案 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-blue-800">
          <p className="mb-1">这不是答题，而是一次"教会 AI"的任务</p>
          <p className="mb-1">我会在没听懂的时候追问你</p>
          <p>只有我真正理解了，任务才算成功</p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!problemText.trim()}
        >
          开始讲解
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 更新 App.tsx 添加路由**

`frontend/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateTaskPage from './pages/CreateTaskPage'
import SessionPage from './pages/SessionPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateTaskPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 5: 安装 react-router-dom**

Run: `cd frontend && npm install react-router-dom`

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add HomePage and CreateTaskPage"
```

---

### Task 4: Zustand 会话状态管理

**Files:**
- Create: `frontend/src/stores/sessionStore.ts`

- [ ] **Step 1: 创建会话状态 Store**

`frontend/src/stores/sessionStore.ts`:
```typescript
import { create } from 'zustand'

export type SessionState = 'idle' | 'connecting' | 'listening' | 'responding' | 'completed' | 'error'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'question' | 'clarification' | 'summary' | 'confirmation' | 'success'
}

export interface SessionStore {
  // Session state
  sessionId: string | null
  state: SessionState
  problemText: string
  subject: string
  goal: string

  // Conversation
  messages: Message[]
  currentTranscript: string

  // Understanding tracker
  understandingLevel: number
  understoodPoints: string[]
  unclearPoints: string[]

  // Actions
  setSessionId: (id: string) => void
  setState: (state: SessionState) => void
  setProblemText: (text: string) => void
  setSubject: (subject: string) => void
  setGoal: (goal: string) => void
  addMessage: (message: Message) => void
  updateCurrentTranscript: (transcript: string) => void
  setUnderstandingLevel: (level: number) => void
  addUnderstoodPoint: (point: string) => void
  addUnclearPoint: (point: string) => void
  removeUnclearPoint: (point: string) => void
  reset: () => void
}

const initialState = {
  sessionId: null,
  state: 'idle' as SessionState,
  problemText: '',
  subject: '数学',
  goal: 'understand_how',
  messages: [],
  currentTranscript: '',
  understandingLevel: 0,
  understoodPoints: [],
  unclearPoints: [],
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setState: (state) => set({ state }),
  setProblemText: (text) => set({ problemText: text }),
  setSubject: (subject) => set({ subject }),
  setGoal: (goal) => set({ goal }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),

  setUnderstandingLevel: (level) => set({ understandingLevel: level }),

  addUnderstoodPoint: (point) =>
    set((state) => ({
      understoodPoints: [...new Set([...state.understoodPoints, point])],
      unclearPoints: state.unclearPoints.filter((p) => p !== point),
    })),

  addUnclearPoint: (point) =>
    set((state) => ({
      unclearPoints: [...new Set([...state.unclearPoints, point])],
    })),

  removeUnclearPoint: (point) =>
    set((state) => ({
      unclearPoints: state.unclearPoints.filter((p) => p !== point),
    })),

  reset: () => set(initialState),
}))
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add Zustand session store"
```

---

### Task 5: SessionPage 核心讲解页

**Files:**
- Create: `frontend/src/pages/SessionPage.tsx`
- Create: `frontend/src/components/AudioRecorder.tsx`
- Create: `frontend/src/components/AudioPlayer.tsx`
- Create: `frontend/src/components/UnderstandingTracker.tsx`
- Create: `frontend/src/components/ConversationBubble.tsx`
- Create: `frontend/src/hooks/useWebSocket.ts`

- [ ] **Step 1: 创建 WebSocket Hook**

`frontend/src/hooks/useWebSocket.ts`:
```typescript
import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '@/stores/sessionStore'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const {
    sessionId,
    problemText,
    subject,
    setSessionId,
    setState,
    addMessage,
    updateCurrentTranscript,
    setUnderstandingLevel,
    addUnderstoodPoint,
    addUnclearPoint,
    removeUnclearPoint,
  } = useSessionStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setState('connecting')
    const ws = new WebSocket(`ws://localhost:3000`)

    ws.onopen = () => {
      // 初始化会话
      ws.send(JSON.stringify({
        type: 'session.init',
        problemText,
        subject,
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'session.created':
          setSessionId(data.sessionId)
          setState('listening')
          break
        case 'response.audio_transcript.delta':
          updateCurrentTranscript((useSessionStore.getState().currentTranscript || '') + data.delta)
          break
        case 'response.audio_transcript.done':
          const transcript = useSessionStore.getState().currentTranscript
          if (transcript) {
            addMessage({
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: transcript,
              timestamp: new Date(),
            })
            updateCurrentTranscript('')
          }
          setState('listening')
          break
        case 'conversation.item.input_audio_transcription.completed':
          addMessage({
            id: `msg_${Date.now()}`,
            role: 'user',
            content: data.transcript,
            timestamp: new Date(),
          })
          break
        case 'error':
          console.error('WS error:', data.message)
          setState('error')
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setState('error')
    }

    ws.onclose = () => {
      setState('idle')
    }

    wsRef.current = ws
  }, [problemText, subject, setSessionId, setState, addMessage, updateCurrentTranscript])

  const sendAudio = useCallback((audioData: Blob) => {
    // 简化：直接发送音频 blob
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // 这里需要将 blob 转为 base64 发送
      // 实际实现中需要使用 input_audio_buffer.append 事件
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, sendAudio }
}
```

- [ ] **Step 2: 创建 AudioRecorder 组件**

`frontend/src/components/AudioRecorder.tsx`:
```typescript
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onAudioData: (data: Blob) => void
  isRecording: boolean
  onToggleRecording: () => void
}

export default function AudioRecorder({ onAudioData, isRecording, onToggleRecording }: AudioRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className="w-32 h-32 rounded-full"
        onClick={onToggleRecording}
      >
        {isRecording ? '停止' : '开始说'}
      </Button>
      <p className="text-gray-500 text-sm">
        {isRecording ? '正在收音...' : '点击开始讲解'}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 创建 AudioPlayer 组件**

`frontend/src/components/AudioPlayer.tsx`:
```typescript
import { useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioData?: string // base64 encoded
  onEnded?: () => void
}

export default function AudioPlayer({ audioData, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current && audioData) {
      audioRef.current.src = `data:audio/pcm;base64,${audioData}`
      audioRef.current.play().catch(console.error)
    }
  }, [audioData])

  return <audio ref={audioRef} onEnded={onEnded} className="hidden" />
}
```

- [ ] **Step 4: 创建 UnderstandingTracker 组件**

`frontend/src/components/UnderstandingTracker.tsx`:
```typescript
import { useSessionStore } from '@/stores/sessionStore'

export default function UnderstandingTracker() {
  const { understandingLevel, understoodPoints, unclearPoints } = useSessionStore()

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">理解进度</h3>

      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${understandingLevel}%` }}
        />
      </div>

      {/* 已理解 */}
      {understoodPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-green-600 font-medium mb-1">我理解了：</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {understoodPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未理解 */}
      {unclearPoints.length > 0 && (
        <div>
          <p className="text-sm text-orange-600 font-medium mb-1">我还没理解：</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {unclearPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-500">?</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {understoodPoints.length === 0 && unclearPoints.length === 0 && (
        <p className="text-sm text-gray-400">等待开始讲解...</p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: 创建 ConversationBubble 组件**

`frontend/src/components/ConversationBubble.tsx`:
```typescript
import { Message } from '@/stores/sessionStore'

interface ConversationBubbleProps {
  message: Message
}

const typeLabels: Record<string, string> = {
  question: '追问',
  clarification: '澄清',
  summary: '总结',
  confirmation: '确认',
  success: '完成',
}

export default function ConversationBubble({ message }: ConversationBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {message.type && (
            <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {typeLabels[message.type] || message.type}
            </span>
          )}
          <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 创建 SessionPage**

`frontend/src/pages/SessionPage.tsx`:
```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'
import UnderstandingTracker from '@/components/UnderstandingTracker'
import ConversationBubble from '@/components/ConversationBubble'
import { Button } from '@/components/ui/button'

export default function SessionPage() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)

  const {
    sessionId,
    state,
    problemText,
    subject,
    messages,
    currentTranscript,
    understandingLevel,
    setProblemText,
    setSubject,
  } = useSessionStore()

  const { connect, disconnect } = useWebSocket()

  // 从 sessionStorage 恢复数据
  useEffect(() => {
    const savedProblem = sessionStorage.getItem('problemText')
    const savedSubject = sessionStorage.getItem('subject')
    if (savedProblem) setProblemText(savedProblem)
    if (savedSubject) setSubject(savedSubject)
  }, [setProblemText, setSubject])

  // 自动连接
  useEffect(() => {
    if (!sessionId && problemText) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [sessionId, problemText, connect, disconnect])

  const handleToggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: 实际控制麦克风录制
  }

  const handleEnd = () => {
    disconnect()
    navigate('/result')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部：题目信息 */}
      <div className="bg-white shadow-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">{subject}</span>
              <h2 className="font-medium line-clamp-1">{problemText}</h2>
            </div>
            <span className="text-sm text-blue-500">
              {state === 'listening' && '等待你讲解...'}
              {state === 'responding' && 'AI 思考中...'}
              {state === 'connecting' && '连接中...'}
            </span>
          </div>
        </div>
      </div>

      {/* 中部：对话流 */}
      <div className="flex-1 container mx-auto max-w-2xl p-4 overflow-y-auto">
        <div className="space-y-4 mb-4">
          {messages.map((msg) => (
            <ConversationBubble key={msg.id} message={msg} />
          ))}
        </div>
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="bg-blue-100 text-blue-800 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">{currentTranscript}</p>
              <p className="text-xs text-blue-400 mt-1">转写中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 理解进度 */}
      <div className="container mx-auto max-w-2xl px-4">
        <UnderstandingTracker />
      </div>

      {/* 底部：控制区 */}
      <div className="bg-white border-t p-4">
        <div className="container mx-auto max-w-2xl flex justify-center gap-4">
          <AudioRecorder
            onAudioData={() => {}}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
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

- [ ] **Step 7: 安装依赖并测试**

Run: `cd frontend && npm install`
Run: `npm run dev`
Expected: 前端在 5173 端口启动

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: add SessionPage with audio components"
```

---

### Task 6: ResultPage 结果页

**Files:**
- Create: `frontend/src/pages/ResultPage.tsx`

- [ ] **Step 1: 创建 ResultPage**

`frontend/src/pages/ResultPage.tsx`:
```typescript
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/sessionStore'

export default function ResultPage() {
  const navigate = useNavigate()
  const {
    problemText,
    subject,
    understandingLevel,
    understoodPoints,
    unclearPoints,
    reset,
  } = useSessionStore()

  const isSuccess = understandingLevel >= 80

  const handleRestart = () => {
    reset()
    sessionStorage.clear()
    navigate('/create')
  }

  const handleNewProblem = () => {
    reset()
    sessionStorage.clear()
    navigate('/create')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 结果总览 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isSuccess ? '🎉 你已经把我讲懂了' : '⏳ 这次还没完全把我讲懂'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {isSuccess
                ? '恭喜你成功教会了我这道题！'
                : '你已经讲清楚了大方向，但还有关键点不够清楚'}
            </p>
            <div className="flex gap-6 mt-4 text-sm text-gray-500">
              <span>理解度：{understandingLevel}%</span>
              <span>学科：{subject}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI 最终复述 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>这是我现在对这道题的理解</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 italic">
              "题目要求我们求解...，用户讲解了使用...方法，首先...，然后...，最后...
              我理解了这道题的整体思路和方法选择的原因。"
            </p>
          </CardContent>
        </Card>

        {/* 已讲清楚 */}
        {understoodPoints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-green-600">✓ 你讲清楚了</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {understoodPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 未讲清楚 */}
        {unclearPoints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-orange-600">? 你还没讲清楚</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {unclearPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-500">?</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 后续动作 */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={handleRestart}>
            再讲一次
          </Button>
          <Button className="flex-1" onClick={handleNewProblem}>
            换一道题
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add ResultPage"
```

---

## Part 4: 集成和收尾 (1 task)

### Task 7: 集成测试

- [ ] **Step 1: 启动后端服务**

Run: `cd backend && npm run dev`
Expected: 后端在 3000 和 3001 端口启动

- [ ] **Step 2: 启动前端服务**

Run: `cd frontend && npm run dev`
Expected: 前端在 5173 端口启动

- [ ] **Step 3: 验证完整流程**

1. 打开浏览器访问 http://localhost:5173
2. 点击"开始讲一题"
3. 输入题目内容，选择学科
4. 点击"开始讲解"
5. 验证 WebSocket 连接建立
6. 验证音频录制和发送功能
7. 验证 AI 回应显示
8. 验证理解进度更新
9. 验证结果页展示

- [ ] **Step 4: 修复发现的问题**

（根据实际测试结果）

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "feat: complete MVP integration"
```

---

## Git Worktree 并行开发策略

为了实现多人/多 agent 并行开发，可以创建以下 worktree：

### 策略一：按职责拆分（推荐）

```bash
# 主仓库（初始 worktree）
main: 项目协调、文档

# Worktree 1: 后端开发
git worktree add worktrees/backend backend-feature
# 职责：ws-server, proxy-handler, session-manager

# Worktree 2: 前端开发（页面）
git worktree add worktrees/frontend-pages frontend-feature
# 职责：HomePage, CreateTaskPage, ResultPage, 路由

# Worktree 3: 前端开发（音频组件）
git worktree add worktrees/frontend-audio audio-feature
# 职责：AudioRecorder, AudioPlayer, useWebSocket, sessionStore

# Worktree 4: 前端开发（SessionPage）
git worktree add worktrees/frontend-session session-feature
# 职责：SessionPage, UnderstandingTracker, ConversationBubble
```

### 策略二：前端/后端两路并行

```bash
# 主仓库
main: 项目脚手架、文档

# Worktree 1: 后端
git worktree add worktrees/backend backend

# Worktree 2: 前端
git worktree add worktrees/frontend frontend
```

### 执行并行开发的步骤

1. **初始化 git 仓库**（如果还不是）：
   ```bash
   cd feymman
   git init
   git add -A
   git commit -m "Initial commit"
   ```

2. **创建 worktree**（使用策略一）：
   ```bash
   git worktree add worktrees/backend -b backend-feature
   git worktree add worktrees/frontend-pages -b frontend-pages-feature
   git worktree add worktrees/frontend-audio -b frontend-audio-feature
   git worktree add worktrees/frontend-session -b frontend-session-feature
   ```

3. **并行执行**：在不同 worktree 中并行开发

4. **合并**：开发完成后，合并回主分支

---

## 验收标准

- [ ] 用户可以访问首页并理解产品价值
- [ ] 用户可以创建任务并输入题目
- [ ] WebSocket 连接正常建立
- [ ] 音频可以录制并发送给后端
- [ ] AI 语音回应可以播放
- [ ] 对话转写正确显示
- [ ] 理解进度正确更新
- [ ] 结果页正确展示
