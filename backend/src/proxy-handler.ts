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

    console.log('[ProxyHandler] API Key configured:', !!apiKey)
    console.log('[ProxyHandler] Connecting to Qwen:', QWEN_WS_URL)

    return new Promise((resolve, reject) => {
      const headers = {
        Authorization: `Bearer ${apiKey}`,
      }

      this.serverWs = new WebSocket(QWEN_WS_URL, { headers })

      this.serverWs.on('open', () => {
        console.log('[ProxyHandler] Connected to Qwen!')
        this.sendSessionConfig()
        resolve()
      })

      this.serverWs.on('message', (data) => {
        console.log('[ProxyHandler] Received from Qwen:', JSON.stringify(data).substring(0, 100))
        this.forwardToClient(data)
      })

      this.serverWs.on('error', (err) => {
        console.error('[ProxyHandler] Server WS error:', err.message, err.code)
        reject(err)
      })

      this.serverWs.on('close', (code, reason) => {
        console.log('[ProxyHandler] Qwen connection closed. Code:', code, 'Reason:', reason?.toString())
        // Only close client if not already closed
        if (this.clientWs.readyState === WebSocket.OPEN) {
          this.clientWs.close()
        }
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

  handleClientMessage(data: unknown): void {
    if (!this.serverWs || this.serverWs.readyState !== WebSocket.OPEN) return

    try {
      const message = JSON.parse(data as string)

      // Log audio messages
      if (message.type === 'input_audio_buffer.append') {
        console.log('[ProxyHandler] Received audio buffer, audio length:', message.audio?.length)
      } else {
        console.log('[ProxyHandler] Forwarding message:', message.type)
      }

      // 处理打断
      if (message.type === 'input_audio_buffer.speech_started') {
        if (this.isResponsing) {
          this.serverWs.send(JSON.stringify({ type: 'response.cancel' }))
          this.isResponsing = false
        }
      }
      this.serverWs.send(data as string)
    } catch {
      console.log('[ProxyHandler] Forwarding raw binary data')
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
