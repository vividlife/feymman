/**
 * Bot Client for E2E Testing
 * Simulates a user interacting via WebSocket
 */

export interface BotMessage {
  direction: 'sent' | 'received';
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface BotConversationRecord {
  sessionId: string | null;
  messages: BotMessage[];
  success: boolean;
  error?: string;
}

export interface CreateBotClientOptions {
  wsUrl?: string;
  problemText?: string;
  subject?: string;
  mockAudioBase64?: string;
}

// Create mock audio data (silent audio frame)
function createMockAudioFrame(): string {
  // A minimal valid base64 audio frame (PCM 16-bit mono 8kHz)
  // This is placeholder data for testing
  return 'data:audio/raw;base64,AAAAAf//////';
}

export async function createBotClient(options: CreateBotClientOptions = {}): Promise<BotConversationRecord> {
  const {
    wsUrl = 'ws://localhost:8089',
    problemText = 'What is 2 + 2?',
    subject = 'math',
    mockAudioBase64 = createMockAudioFrame(),
  } = options;

  const record: BotConversationRecord = {
    sessionId: null,
    messages: [],
    success: false,
  };

  const addMessage = (direction: 'sent' | 'received', type: string, payload: unknown) => {
    record.messages.push({
      direction,
      type,
      payload,
      timestamp: Date.now(),
    });
  };

  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null;
    let sessionId: string | null = null;
    let responseAudioTranscript = '';
    let isSessionCreated = false;
    let isResponseDone = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[BotClient] Connected to', wsUrl);
          reconnectAttempts = 0;

          // Step 1: Send session.init
          const sessionInitPayload = {
            problemText,
            subject,
          };
          addMessage('sent', 'session.init', sessionInitPayload);
          ws?.send(JSON.stringify({
            type: 'session.init',
            ...sessionInitPayload,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[BotClient] Received:', message.type);

            // Step 2: Handle session.created
            if (message.type === 'session.created') {
              sessionId = message.sessionId;
              record.sessionId = sessionId;
              isSessionCreated = true;
              addMessage('received', 'session.created', { sessionId });

              // Step 3: Send audio data
              // Send input_audio_buffer.append
              const appendPayload = { audio: mockAudioBase64 };
              addMessage('sent', 'input_audio_buffer.append', appendPayload);
              ws?.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: mockAudioBase64,
              }));

              // Send input_audio_buffer.commit
              addMessage('sent', 'input_audio_buffer.commit', {});
              ws?.send(JSON.stringify({
                type: 'input_audio_buffer.commit',
              }));
            }

            // Step 4: Handle AI responses
            if (message.type === 'response.created') {
              addMessage('received', 'response.created', message);
            }

            if (message.type === 'response.audio_transcript.delta') {
              responseAudioTranscript += message.delta || '';
              addMessage('received', 'response.audio_transcript.delta', { delta: message.delta });
            }

            if (message.type === 'response.audio_transcript.done') {
              addMessage('received', 'response.audio_transcript.done', { transcript: responseAudioTranscript });
              isResponseDone = true;

              // Conversation complete
              record.success = true;
              ws?.close();
              resolve(record);
            }

            // Handle errors
            if (message.type === 'error') {
              record.error = message.message || 'Unknown error';
              addMessage('received', 'error', message);
              record.success = false;
              ws?.close();
              resolve(record);
            }
          } catch (err) {
            console.error('[BotClient] Failed to parse message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('[BotClient] WebSocket error:', error);
          record.error = 'WebSocket connection error';
        };

        ws.onclose = (event) => {
          console.log('[BotClient] Connection closed:', event.code, event.reason);

          // If session wasn't created and we haven't exceeded reconnect attempts, retry
          if (!isSessionCreated && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`[BotClient] Reconnecting... (attempt ${reconnectAttempts})`);
            setTimeout(connect, 1000);
          } else if (!isSessionCreated) {
            record.error = `Failed to connect after ${maxReconnectAttempts} attempts`;
            resolve(record);
          } else if (!isResponseDone) {
            // Session was created but response wasn't complete
            record.error = 'Connection closed before response completion';
            resolve(record);
          }
        };
      } catch (err) {
        reject(err);
      }
    };

    // Set a timeout to resolve the promise if server doesn't respond
    setTimeout(() => {
      if (!record.success) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          record.error = 'Timeout waiting for response';
        } else {
          record.error = 'Connection timeout';
        }
        resolve(record);
      }
    }, 30000);

    connect();
  });
}
