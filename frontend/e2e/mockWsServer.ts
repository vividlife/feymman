import { WebSocketServer, WebSocket } from 'ws'

// Server configuration
const PORT = 8089
const DEFAULT_DELAY = 100 // ms delay between AI response messages

// Server instance and state
let wss: WebSocketServer | null = null
let server: ReturnType<WebSocketServer['close']> | null = null

// Audio buffer to store appended audio data
let audioBuffer: Buffer[] = []

// Configurable delay for AI responses
let responseDelay = DEFAULT_DELAY

/**
 * Set the delay between AI response messages
 */
export function setResponseDelay(delayMs: number): void {
  responseDelay = delayMs
}

/**
 * Get the current audio buffer
 */
export function getAudioBuffer(): Buffer[] {
  return audioBuffer
}

/**
 * Clear the audio buffer
 */
export function clearAudioBuffer(): void {
  audioBuffer = []
}

/**
 * Send a JSON message to a WebSocket client
 */
function sendMessage(ws: WebSocket, message: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
    console.log(`[MockWS] Sent: ${JSON.stringify(message)}`)
  }
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(ws: WebSocket, data: string): void {
  try {
    const message = JSON.parse(data)
    console.log(`[MockWS] Received: ${JSON.stringify(message)}`)

    switch (message.type) {
      case 'session.init':
        handleSessionInit(ws, message)
        break

      case 'input_audio_buffer.append':
        handleInputAudioBufferAppend(ws, message)
        break

      case 'input_audio_buffer.commit':
        handleInputAudioBufferCommit(ws, message)
        break

      default:
        console.log(`[MockWS] Unknown message type: ${message.type}`)
    }
  } catch (error) {
    console.error('[MockWS] Error parsing message:', error)
  }
}

/**
 * Handle session.init message
 * Sends session.created followed by session.updated
 */
function handleSessionInit(ws: WebSocket, _message: any): void {
  // Send session.created
  sendMessage(ws, {
    type: 'session.created',
    sessionId: `mock-session-${Date.now()}`
  })

  // Send session.updated with full session object after a short delay
  setTimeout(() => {
    sendMessage(ws, {
      type: 'session.updated',
      session: {
        id: `mock-session-${Date.now()}`,
        model: 'qwen-aio',
        modalities: ['audio', 'text'],
        instructions: 'You are a helpful math tutor.',
        sessionConfig: {
          audioOutput: {
            voice: 'alloy',
            format: 'audio/wav'
          },
          inputAudioTranscription: {
            model: 'whisper-1'
          }
        }
      }
    })
  }, responseDelay)
}

/**
 * Handle input_audio_buffer.append message
 * Records audio data
 */
function handleInputAudioBufferAppend(ws: WebSocket, message: any): void {
  if (message.audio) {
    // Store the audio data (base64 encoded)
    const audioData = Buffer.from(message.audio, 'base64')
    audioBuffer.push(audioData)
    console.log(`[MockWS] Received audio data, buffer size: ${audioBuffer.length}`)
  }
  // Acknowledge the append
  sendMessage(ws, {
    type: 'input_audio_buffer.append',
    status: 'ok'
  })
}

/**
 * Handle input_audio_buffer.commit message
 * Simulates AI response flow
 */
async function handleInputAudioBufferCommit(ws: WebSocket, _message: any): Promise<void> {
  console.log(`[MockWS] Committing audio buffer with ${audioBuffer.length} chunks`)

  // Clear the buffer after commit
  audioBuffer = []

  // Send response.created
  sendMessage(ws, {
    type: 'response.created',
    response: {
      id: `response-${Date.now()}`,
      status: 'in_progress'
    }
  })

  // Wait before sending transcript delta
  await sleep(responseDelay)

  // Send response.audio_transcript.delta messages (simulated transcription)
  const transcriptParts = [
    '好的，让我来',
    '看一下这道题。',
    '首先需要理解',
    '题目的意思。'
  ]

  for (const part of transcriptParts) {
    sendMessage(ws, {
      type: 'response.audio_transcript.delta',
      delta: part
    })
    await sleep(responseDelay)
  }

  // Send response.audio_transcript.done
  sendMessage(ws, {
    type: 'response.audio_transcript.done',
    transcript: transcriptParts.join('')
  })

  await sleep(responseDelay)

  // Send response.done
  sendMessage(ws, {
    type: 'response.done',
    response: {
      id: `response-${Date.now()}`,
      status: 'completed',
      output: {
        audio_transcript: transcriptParts.join('')
      }
    }
  })
}

/**
 * Start the mock WebSocket server
 */
export async function startMockServer(): Promise<WebSocketServer> {
  return new Promise((resolve, reject) => {
    try {
      wss = new WebSocketServer({ port: PORT })

      wss.on('listening', () => {
        console.log(`[MockWS] Server started on port ${PORT}`)
        resolve(wss!)
      })

      wss.on('error', (error) => {
        console.error('[MockWS] Server error:', error)
        reject(error)
      })

      wss.on('connection', (ws: WebSocket) => {
        console.log('[MockWS] Client connected')

        ws.on('message', (data: Buffer) => {
          handleMessage(ws, data.toString())
        })

        ws.on('close', () => {
          console.log('[MockWS] Client disconnected')
        })

        ws.on('error', (error) => {
          console.error('[MockWS] WebSocket error:', error)
        })
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Stop the mock WebSocket server gracefully
 */
export async function stopMockServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!wss) {
      console.log('[MockWS] Server not running')
      resolve()
      return
    }

    // Close all client connections first
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close()
      }
    })

    wss.close((err) => {
      if (err) {
        console.error('[MockWS] Error closing server:', err)
        reject(err)
      } else {
        console.log('[MockWS] Server stopped')
        wss = null
        resolve()
      }
    })
  })
}

/**
 * Get the server instance
 */
export function getServer(): WebSocketServer | null {
  return wss
}
