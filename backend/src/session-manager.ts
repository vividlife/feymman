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
