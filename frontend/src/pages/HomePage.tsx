import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* 主标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            把一道题讲给 AI 听，直到它真的听懂
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            基于费曼学习法的实时语音学习 Agent
          </p>
          <p className="text-gray-500">
            你负责讲，AI 负责听、追问，直到被你讲懂
          </p>
        </div>

        {/* 主入口 */}
        <div className="flex justify-center gap-4 mb-16">
          <Button size="lg" onClick={() => navigate('/create')}>
            开始讲一题
          </Button>
          <Button size="lg" variant="outline">
            体验示例
          </Button>
        </div>

        {/* 三步说明 */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-semibold text-center mb-8">如何使用</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第一步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">选一道题，输入题目内容</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第二步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">开口讲给 AI 听，像教真人一样</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">第三步</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">直到 AI 真正被你讲懂</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 适用场景 */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">适用场景</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['数学题讲解', '物理解题思路', '错题复盘', '知识点口头讲解'].map((scene) => (
              <span
                key={scene}
                className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-700"
              >
                {scene}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
