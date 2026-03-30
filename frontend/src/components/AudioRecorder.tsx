import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface AudioRecorderProps {
  onAudioData: (data: Blob) => void
  isRecording: boolean
  onToggleRecording: () => void
}

export default function AudioRecorder({ onAudioData, isRecording, onToggleRecording }: AudioRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className="w-32 h-32 rounded-full"
        onClick={onToggleRecording}
      >
        {isRecording ? '停止' : '开始说'}
      </Button>
      <p className="text-gray-500 text-sm">
        {isRecording ? '正在收音...' : '点击开始讲解'}
      </p>
    </div>
  )
}
