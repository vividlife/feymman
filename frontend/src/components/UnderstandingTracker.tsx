import { useSessionStore } from '@/stores/sessionStore'

export default function UnderstandingTracker() {
  const { understandingLevel, understoodPoints, unclearPoints } = useSessionStore()

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">理解进度</h3>

      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${understandingLevel}%` }}
        />
      </div>

      {/* 已理解 */}
      {understoodPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-green-600 font-medium mb-1">我理解了：</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {understoodPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未理解 */}
      {unclearPoints.length > 0 && (
        <div>
          <p className="text-sm text-orange-600 font-medium mb-1">我还没理解：</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {unclearPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-500">?</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {understoodPoints.length === 0 && unclearPoints.length === 0 && (
        <p className="text-sm text-gray-400">等待开始讲解...</p>
      )}
    </div>
  )
}
