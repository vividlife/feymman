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
