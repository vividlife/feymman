export type AIResponseType = 'question' | 'confirmation' | 'statement'

export interface AIResponse {
  type: AIResponseType
}

export class UnderstandingJudge {
  parseAIResponse(response: string): AIResponse {
    if (response.includes('对吗') || response.includes('对吧')) {
      return { type: 'confirmation' }
    }
    if (response.includes('？') || response.includes('?')) {
      return { type: 'question' }
    }
    return { type: 'statement' }
  }

  isFullyUnderstood(session: { understandingLevel: number; unclearPoints: string[] }): boolean {
    return session.understandingLevel >= 80 && session.unclearPoints.length === 0
  }
}
