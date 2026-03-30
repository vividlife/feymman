import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onAudioData?: (base64: string) => void
  disabled?: boolean
}

export default function AudioRecorder({ onAudioData, disabled }: AudioRecorderProps) {
  const { isRecording, startRecording, stopRecording, getAudioBase64 } = useAudioRecorder()

  const handleToggle = async () => {
    if (isRecording) {
      await stopRecording()
      // Send audio data if callback provided
      if (onAudioData) {
        const base64 = await getAudioBase64()
        if (base64) {
          onAudioData(base64)
        }
      }
    } else {
      await startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className="w-32 h-32 rounded-full"
        onClick={handleToggle}
        disabled={disabled}
      >
        {isRecording ? '停止' : '开始说'}
      </Button>
      <p className="text-gray-500 text-sm">
        {isRecording ? '正在收音... 点击停止发送' : '点击开始讲解'}
      </p>
    </div>
  )
}
