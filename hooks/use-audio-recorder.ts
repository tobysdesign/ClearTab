import { useState, useRef, useCallback } from 'react'
import { isExtension, saveAudioToExtensionStorage, getEnvironmentConfig } from '@/lib/chrome-extension-utils'

export type RecordingState = 'idle' | 'requesting-permission' | 'recording' | 'paused' | 'processing'

interface UseAudioRecorderOptions {
  onTranscriptionComplete?: (text: string) => void
  onError?: (error: string) => void
}

export function useAudioRecorder({ onTranscriptionComplete, onError }: UseAudioRecorderOptions = {}) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const requestPermission = useCallback(async () => {
    setState('requesting-permission')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      return true
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      setState('idle')
      
      let errorMessage = 'Failed to access microphone. Please check permissions.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Microphone access is not supported in this browser.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application. Please close other apps using the microphone and try again.'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security restrictions. Please ensure you are using HTTPS or localhost.'
      }
      
      onError?.(errorMessage)
      return false
    }
  }, [onError])

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const hasPermission = await requestPermission()
      if (!hasPermission) return
    }

    if (!streamRef.current) return

    chunksRef.current = []
    setAudioBlob(null)
    setDuration(0)

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    })

    mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size)
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      console.log('MediaRecorder stopped, chunks:', chunksRef.current.length)
      const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
      console.log('Created audio blob, size:', blob.size)
      setAudioBlob(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // Collect data every second
    setState('recording')
    startTimer()
  }, [requestPermission, startTimer, onError])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      stopTimer()
    }
  }, [state, stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      startTimer()
    }
  }, [state, startTimer])

  const stopRecording = useCallback(() => {
    console.log('stopRecording called, mediaRecorder exists:', !!mediaRecorderRef.current)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      stopTimer()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setState('processing')
  }, [stopTimer])

  const transcribeAudio = useCallback(async () => {
    console.log('transcribeAudio called, audioBlob:', !!audioBlob)
    if (!audioBlob) {
      console.error('No audio blob available')
      onError?.('No audio recorded')
      return
    }

    console.log('Audio blob size:', audioBlob.size)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`)

      const config = getEnvironmentConfig()
      const apiUrl = config.isExtension 
        ? `${config.baseUrl}/api/transcribe`
        : '/api/transcribe'

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Add extension ID header if in extension context
        headers: config.isExtension && config.extensionId ? {
          'X-Extension-ID': config.extensionId
        } : {}
      })

      console.log('Transcription response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Transcription API error:', errorText)
        onError?.(`Transcription failed: ${response.statusText}`)
        setState('idle')
        return
      }

      const result = await response.json()
      console.log('Transcription result:', result)

      if (result.success) {
        console.log('Calling onTranscriptionComplete with:', result.data.text)
        // Keep state as 'processing' - let the component handle state changes
        await onTranscriptionComplete?.(result.data.text)
      } else {
        onError?.(result.error || 'Failed to transcribe audio')
        setState('idle')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      onError?.('Failed to transcribe audio')
      setState('idle')
    }
  }, [audioBlob, onTranscriptionComplete, onError])

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return

    const audioTracks = streamRef.current.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = isMuted
    })
    setIsMuted(!isMuted)
  }, [isMuted])

  const saveAudioLocally = useCallback(async () => {
    if (!audioBlob) return

    const filename = `voice-note-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`
    const config = getEnvironmentConfig()

    if (config.isExtension) {
      // Save to Chrome extension storage
      try {
        const storageKey = await saveAudioToExtensionStorage(audioBlob, filename)
        if (storageKey) {
          console.log('Audio saved to extension storage with key:', storageKey)
          // You could also trigger a download or show in extension popup
        }
      } catch (error) {
        console.error('Failed to save to extension storage:', error)
        // Fallback to regular download
        downloadAudioFile(audioBlob, filename)
      }
    } else {
      // Regular web download
      downloadAudioFile(audioBlob, filename)
    }
  }, [audioBlob])

  const downloadAudioFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reset = useCallback(() => {
    stopTimer()
    setDuration(0)
    setAudioBlob(null)
    setIsMuted(false)
    setState('idle')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [stopTimer])

  return {
    state,
    duration,
    audioBlob,
    isMuted,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    toggleMute,
    transcribeAudio,
    saveAudioLocally,
    reset
  }
}