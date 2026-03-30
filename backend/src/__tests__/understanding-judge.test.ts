import { describe, test, expect, beforeEach } from 'vitest'
import { UnderstandingJudge } from '../understanding-judge'

describe('UnderstandingJudge', () => {
  let judge: UnderstandingJudge

  beforeEach(() => {
    judge = new UnderstandingJudge()
  })

  describe('parseAIResponse', () => {
    test('identifies question type', () => {
      const result = judge.parseAIResponse('这一步为什么可以这样做？')
      expect(result.type).toBe('question')
    })

    test('identifies confirmation type', () => {
      const result = judge.parseAIResponse('你的意思是先列方程，再求解，对吗？')
      expect(result.type).toBe('confirmation')
    })
  })

  describe('isFullyUnderstood', () => {
    test('returns true when understanding >= 80 and no unclear points', () => {
      const session = { understandingLevel: 80, unclearPoints: [] } as any
      expect(judge.isFullyUnderstood(session)).toBe(true)
    })

    test('returns false when unclear points remain', () => {
      const session = { understandingLevel: 90, unclearPoints: ['某个点'] } as any
      expect(judge.isFullyUnderstood(session)).toBe(false)
    })
  })
})
