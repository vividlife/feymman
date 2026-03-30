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
