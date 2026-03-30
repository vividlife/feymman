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
      console.log('[WS Server] Client connected')
      let sessionId: string | null = null

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          console.log('[WS Server] Received:', message.type)

          if (message.type === 'session.init') {
            console.log('[WS Server] Initializing session:', { problemText: message.problemText, subject: message.subject })
            // 初始化会话
            const { problemText, subject } = message
            const session = sessionManager.createSession(problemText, subject || '通用')
            sessionId = session.id
            console.log('[WS Server] Session created:', session.id)

            // 创建代理处理器
            const proxy = new ProxyHandler({
              sessionId: session.id,
              clientWs: ws,
              problemText,
              subject,
              onSessionComplete: (sid) => {
                console.log(`[WS Server] Session ${sid} completed`)
              },
            })

            this.proxies.set(session.id, proxy)

            // 发送 session_id 给客户端
            ws.send(JSON.stringify({
              type: 'session.created',
              sessionId: session.id,
            }))
            console.log('[WS Server] Sent session.created to client')

            // 连接 Qwen
            proxy.connect().catch((err) => {
              console.error('[WS Server] Failed to connect to Qwen:', err)
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
          console.error('[WS Server] Failed to parse message:', err)
        }
      })

      ws.on('close', () => {
        console.log('[WS Server] Client disconnected')
        if (sessionId) {
          this.proxies.get(sessionId)?.close()
          this.proxies.delete(sessionId)
        }
      })

      ws.on('error', (err) => {
        console.error('[WS Server] Client WS error:', err)
      })
    })
  }

  start(): void {
    // WS server port is set in constructor, log on first connection instead
    this.wss.on('listening', () => {
      const addr = this.wss.address()
      const port = typeof addr === 'object' ? addr?.port : addr
      console.log('Feynman WS Server running on port', port)
    })
  }
}
