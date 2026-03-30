import { useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioData?: string // base64 encoded
  onEnded?: () => void
}

export default function AudioPlayer({ audioData, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current && audioData) {
      audioRef.current.src = `data:audio/pcm;base64,${audioData}`
      audioRef.current.play().catch(console.error)
    }
  }, [audioData])

  return <audio ref={audioRef} onEnded={onEnded} className="hidden" />
}
