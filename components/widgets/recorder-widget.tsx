'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Mic from 'lucide-react/dist/esm/icons/mic'
import Square from 'lucide-react/dist/esm/icons/square'
import Pause from 'lucide-react/dist/esm/icons/pause'
import Play from 'lucide-react/dist/esm/icons/play'
import Check from 'lucide-react/dist/esm/icons/check'
import { cn } from '@/lib/utils'
import styles from './recorder-widget.module.css'
import { ClientOnly } from '@/components/ui/safe-motion'
import { WidgetHeader } from '@/components/ui/widget-header'

interface RecorderWidgetProps {
  className?: string
}

type RecordingState = 'idle' | 'recording' | 'paused'

export function RecorderWidget({ className }: RecorderWidgetProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer effect
  useEffect(() => {
    if (state === 'recording') {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = () => {
    setIsFlipped(true)
    setTimeout(() => {
      setState('recording')
      setDuration(0)
    }, 400) // Half of flip animation duration
  }

  const handleStopRecording = () => {
    setIsFlipped(true)
    setTimeout(() => {
      setState('idle')
      setDuration(0)
      setTimeout(() => {
        setIsFlipped(false)
      }, 100)
    }, 400) // Half of flip animation duration
  }

  const handlePauseRecording = () => {
    setState('paused')
  }

  const handleResumeRecording = () => {
    setState('recording')
  }

  // Generate waveform visualization
  const generateWaveform = () => {
    const bars = [];
    const numBars = 20;
    
    for (let i = 0; i < numBars; i++) {
      const animationDelay = `${i * 0.05}s`;
      bars.push(
        <div
          key={i}
          className={cn(styles.waveformBar, {
            [styles.waveformBarActive]: state === 'recording'
          })}
          style={{ animationDelay }}
        />
      );
    }
    
    return bars;
  };

  return (
    <ClientOnly>
      <div className={cn(styles.flipContainer, { [styles.flipped]: isFlipped }, className)}>
        <div className={styles.flipper}>
          {/* Front Side (Idle) */}
          <div className={styles.front}>
            <div className={styles.container}>
              <div className={styles.content}>
                {/* Header */}
                <WidgetHeader title="Recorder" />

                {/* Body */}
                <div className={styles.body}>
                  {/* Button Container */}
                  <div className={styles.buttonContainer}>
                    <button
                      onClick={handleStartRecording}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={cn(styles.button, 'group')}
                    >
                      <div className={styles.buttonOuter}>
                        {/* Main shading background */}
                        <div className={styles.buttonBackground} />
                        
                        {/* Gradient border */}
                        <div className={styles.buttonBorder} />
                        
                        {/* Top highlight for lighter upper half */}
                        <div className={styles.buttonTopHighlight} />
                        
                        {/* Recording indicator dot (positioned top-right) */}
                        <div className={cn(styles.recordingDot, { [styles.recordingDotHover]: isHovered })} />
                        
                        {/* Microphone icon */}
                        <div className={styles.microphoneIcon}>
                          <Mic className={styles.micIcon} />
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Text */}
                  <p className={styles.bodyText}>
                    Start a voice note
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side (Recording) */}
          <div className={styles.back}>
            <div className={styles.container}>
              <div className={styles.content}>
                {/* Header */}
                <WidgetHeader title="Recorder" />

                {/* Body */}
                <div className={styles.recordingBody}>
                  {/* Waveform visualization */}
                  <div className={styles.waveformContainer}>
                    {generateWaveform()}
                  </div>
                  
                  {/* Timer */}
                  <div className={styles.timerContainer}>
                    <p className={styles.timer}>{formatTime(duration)}</p>
                  </div>
                  
                  {/* Controls */}
                  <div className={styles.recordingControls}>
                    {state === 'recording' && (
                      <>
                        <button 
                          onClick={handlePauseRecording}
                          className={styles.controlButton}
                        >
                          <div className={styles.controlButtonInner}>
                            <Pause className={styles.controlIcon} />
                          </div>
                        </button>
                        
                        <button 
                          onClick={handleStopRecording}
                          className={cn(styles.controlButton, styles.doneButton)}
                        >
                          <div className={styles.controlButtonInner}>
                            <Check className={styles.controlIcon} />
                          </div>
                          <span className={styles.doneText}>Done</span>
                        </button>
                      </>
                    )}
                    
                    {state === 'paused' && (
                      <>
                        <button 
                          onClick={handleResumeRecording}
                          className={styles.controlButton}
                        >
                          <div className={styles.controlButtonInner}>
                            <Play className={styles.controlIcon} />
                          </div>
                        </button>
                        
                        <button 
                          onClick={handleStopRecording}
                          className={cn(styles.controlButton, styles.doneButton)}
                        >
                          <div className={styles.controlButtonInner}>
                            <Check className={styles.controlIcon} />
                          </div>
                          <span className={styles.doneText}>Done</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
} 