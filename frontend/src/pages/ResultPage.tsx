import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/sessionStore'

export default function ResultPage() {
  const navigate = useNavigate()
  const {
    subject,
    understandingLevel,
    understoodPoints,
    unclearPoints,
    messages,
    reset,
  } = useSessionStore()

  const isSuccess = understandingLevel >= 80

  const handleReplay = () => {
    // Replay the session - navigate back to session page
    navigate('/session')
  }

  const handleNewProblem = () => {
    reset()
    navigate('/create')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 结果总览 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isSuccess ? '🎉 你已经把我讲懂了' : '⏳ 这次还没完全把我讲懂'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {isSuccess
                ? '恭喜你成功教会了我这道题！'
                : '你已经讲清楚了大方向，但还有关键点不够清楚'}
            </p>
            <div className="flex gap-6 mt-4 text-sm text-gray-500">
              <span>理解度：{understandingLevel}%</span>
              <span>学科：{subject}</span>
            </div>
          </CardContent>
        </Card>

        {/* 对话回顾 */}
        {messages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>对话回顾</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {messages.slice(-10).map((msg, i) => (
                  <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>
                    <span className="font-medium">{msg.role === 'user' ? '你: ' : 'AI: '}</span>
                    {msg.content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 已讲清楚 */}
        {understoodPoints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-green-600">✓ 你讲清楚了</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {understoodPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 未讲清楚 */}
        {unclearPoints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-orange-600">? 你还没讲清楚</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {unclearPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-500">?</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 后续动作 */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={handleReplay}>
            再听一遍
          </Button>
          <Button className="flex-1" onClick={handleNewProblem}>
            换一道题
          </Button>
        </div>
      </div>
    </div>
  )
}