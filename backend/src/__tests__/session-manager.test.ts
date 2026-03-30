import { describe, test, expect, beforeEach } from 'vitest'
import { SessionManager } from '../session-manager'

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
  })

  test('getSession returns session by id', () => {
    const created = manager.createSession('题目', '物理')
    const retrieved = manager.getSession(created.id)
    expect(retrieved).toEqual(created)
  })

  test('getSession returns undefined for non-existent id', () => {
    expect(manager.getSession('non-existent')).toBeUndefined()
  })

  test('updateSession updates session fields', () => {
    const session = manager.createSession('题目', '数学')
    const updated = manager.updateSession(session.id, {
      state: 'listening',
      understandingLevel: 50,
    })
    expect(updated?.state).toBe('listening')
    expect(updated?.understandingLevel).toBe(50)
  })

  test('deleteSession removes session', () => {
    const session = manager.createSession('题目', '数学')
    manager.deleteSession(session.id)
    expect(manager.getSession(session.id)).toBeUndefined()
  })
})
