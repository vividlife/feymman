import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

const SUBJECTS = ['数学', '物理', '化学', '通用']
const GOALS = [
  { value: 'understand_how', label: '讲懂这道题怎么做' },
  { value: 'understand_why', label: '讲懂这道题为什么这么做' },
  { value: 'understand_concept', label: '讲懂某个知识点' },
]

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const [problemText, setProblemText] = useState('')
  const [subject, setSubject] = useState('数学')
  const [goal, setGoal] = useState('understand_how')
  const { setProblemText: setStoreProblem, setSubject: setStoreSubject, setGoal: setStoreGoal } = useSessionStore()

  const handleStart = () => {
    if (!problemText.trim()) return
    setStoreProblem(problemText)
    setStoreSubject(subject)
    setStoreGoal(goal)
    navigate('/session')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">创建讲解任务</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>题目内容</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入或粘贴题目..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>学科</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-colors',
                    subject === s
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>讲解目标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <label key={g.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="goal"
                    value={g.value}
                    checked={goal === g.value}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 提示文案 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-blue-800">
          <p className="mb-1">这不是答题，而是一次"教会 AI"的任务</p>
          <p className="mb-1">我会在没听懂的时候追问你</p>
          <p>只有我真正理解了，任务才算成功</p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!problemText.trim()}
        >
          开始讲解
        </Button>
      </div>
    </div>
  )
}
