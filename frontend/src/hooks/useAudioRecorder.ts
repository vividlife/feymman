import { useState, useRef, useCallback } from 'react'

export interface UseAudioRecorderReturn {
  isRecording: boolean
  audioBlob: Blob | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  getAudioBase64: () => Promise<string | null>
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const stopResolveRef = useRef<(() => void) | null>(null)

  const startRecording = useCallback(async () => {
    try {
      console.log('[AudioRecorder] Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[AudioRecorder] Microphone permission granted, stream:', stream.id)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      console.log('[AudioRecorder] Using mimeType:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      streamRef.current = stream
      console.log('[AudioRecorder] MediaRecorder created, state:', mediaRecorder.state)

      mediaRecorder.ondataavailable = (event) => {
        console.log('[AudioRecorder] ondataavailable, size:', event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstart = () => {
        console.log('[AudioRecorder] MediaRecorder started')
      }

      mediaRecorder.onstop = () => {
        console.log('[AudioRecorder] MediaRecorder stopped, chunks:', audioChunksRef.current.length)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('[AudioRecorder] Created blob, size:', blob.size)
        setAudioBlob(blob)
        audioChunksRef.current = []
        streamRef.current?.getTracks().forEach(track => track.stop())
        // 调用 stopRecording 中设置的 resolve
        if (stopResolveRef.current) {
          stopResolveRef.current()
          stopResolveRef.current = null
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('[AudioRecorder] MediaRecorder error:', event)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)
      setIsRecording(true)
      console.log('[AudioRecorder] Recording started successfully')
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording, error:', error)
      console.error('[AudioRecorder] Error name:', error?.name)
      console.error('[AudioRecorder] Error message:', error?.message)
      throw error
    }
  }, [])

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        stopResolveRef.current = resolve
        setIsRecording(false)
        mediaRecorderRef.current.stop()
      } else {
        resolve()
      }
    })
  }, [isRecording])

  const getAudioBase64 = useCallback(async (): Promise<string | null> => {
    if (!audioBlob) return null

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = () => {
        console.error('[AudioRecorder] FileReader error')
        reject(new Error('Failed to read audio blob'))
      }
      reader.readAsDataURL(audioBlob)
    })
  }, [audioBlob])

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    getAudioBase64,
  }
}
