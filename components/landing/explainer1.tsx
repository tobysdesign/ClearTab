'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  CheckIcon,
  PauseIcon,
  TrashIcon,
  MicIcon,
  SparkleIcon,
  CopyIcon,
  RetryIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  CloseIcon,
} from '@/components/icons'
import { WidgetHeader, Button } from '@cleartab/ui'
import recorderStyles from '@/components/widgets/recorder-widget.module.css'
import styles from './explainer1.module.css'
import { cn } from '@/lib/utils'

// ── VIRTUAL MOUSE CURSOR ─────────────────────────────────────────────
interface VirtualCursorProps {
  x: number
  y: number
  visible: boolean
  clicked: boolean
  duration?: number
}

function VirtualCursor({ x, y, visible, clicked, duration = 850 }: VirtualCursorProps) {
  return (
    <div
      className={styles.virtualCursor}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        opacity: visible ? 1 : 0,
        transitionProperty: 'transform, opacity',
        transitionDuration: `${duration}ms, 320ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1), ease',
      }}
      aria-hidden="true"
    >
      {/* Click ripple circle radiating from pointer tip */}
      {clicked && <span className={styles.cursorRipple} />}

      {/* Pointer arrow with click press-down feedback */}
      <div className={cn(styles.cursorPointer, clicked && styles.cursorPointerClicked)}>
        <svg viewBox="0 0 16 22" width="22" height="30" className={styles.cursorSvg}>
          <path
            d="M1 1v17.5l4.6-4.4 2.9 6.6 2.7-1.2-2.9-6.4H15L1 1Z"
            fill="#f4f4f5"
            stroke="#090d16"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

// Waveform bar heights (42 bars)
const BASE_WAVE_HEIGHTS = [
  6, 10, 18, 14, 22, 28, 24, 14, 8, 16, 26, 32, 22, 16, 12,
  20, 30, 26, 14, 10, 20, 28, 34, 18, 12, 16, 22, 28, 20, 14,
  8, 16, 24, 30, 26, 14, 10, 12, 20, 26, 16, 10,
]

export function Explainer1() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Demo phases:
  // 0: Idle (ready to record - media_1791933069734.png)
  // 1: Recording in progress (timer + live waveform - media_1791933045265.png)
  // 2: Transcribing note (progress bar fills 0% -> 100%)
  // 3: Saved to Notes (media_1791939348896.png)
  // 4: Text highlighted in Notes + AI Chat drawer open with summary (media_1791844087647.png)
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [transcribeProgress, setTranscribeProgress] = useState(0)

  const [pointer, setPointer] = useState<{ x: number; y: number; visible: boolean; clicked: boolean; duration: number }>({
    x: 0,
    y: 0,
    visible: false,
    clicked: false,
    duration: 850,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Live timer during recording phase
  useEffect(() => {
    if (phase !== 1) return
    const timer = setInterval(() => {
      setRecordSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

  // Progress fill during transcribing phase
  useEffect(() => {
    if (phase !== 2) return
    setTranscribeProgress(18)
    const t1 = setTimeout(() => setTranscribeProgress(55), 500)
    const t2 = setTimeout(() => setTranscribeProgress(86), 1100)
    const t3 = setTimeout(() => setTranscribeProgress(100), 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [phase])

  const hasPlayedRef = useRef(false)

  // Scripted non-interactive director: plays once when scrolled into viewport, does NOT loop
  useEffect(() => {
    if (!mounted || hasPlayedRef.current) return

    const container = containerRef.current
    if (!container) return

    let cancelled = false
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const getTargetPos = (selector: string, fallbackX: number, fallbackY: number) => {
      const c = containerRef.current
      if (!c) return { x: fallbackX, y: fallbackY }
      const el = c.querySelector(selector) as HTMLElement | null
      if (!el) return { x: fallbackX, y: fallbackY }
      const cRect = c.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      return {
        x: Math.round(eRect.left - cRect.left + eRect.width / 2),
        y: Math.round(eRect.top - cRect.top + eRect.height / 2),
      }
    }

    async function runSequence() {
      setPhase(0)
      setRecordSeconds(0)
      setTranscribeProgress(0)

      await sleep(500)
      if (cancelled) return

      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      // 1. Natural entry: Position pointer near Start Recording button in voice note widget
      const initialRecordPos = getTargetPos('[aria-label="Start recording"]', Math.round(containerRect.width * 0.22), 135)

      setPointer({
        x: initialRecordPos.x - 45,
        y: initialRecordPos.y + 35,
        visible: true,
        clicked: false,
        duration: 0,
      })

      await sleep(350)
      if (cancelled) return

      // 2. Glide smoothly to Start recording button
      const recordBtnPos = getTargetPos('[aria-label="Start recording"]', Math.round(containerRect.width * 0.22), 135)
      setPointer({
        x: recordBtnPos.x,
        y: recordBtnPos.y,
        visible: true,
        clicked: false,
        duration: 850,
      })

      await sleep(950)
      if (cancelled) return

      // Click Start recording (ripple)
      setPointer((prev) => ({ ...prev, clicked: true }))
      await sleep(180)
      if (cancelled) return
      setPointer((prev) => ({ ...prev, clicked: false }))

      // Transition to Phase 1: Recording
      setPhase(1)

      // Cursor steps aside comfortably while recording counts up
      await sleep(250)
      if (cancelled) return
      setPointer((prev) => ({
        ...prev,
        x: prev.x + 75,
        y: prev.y + 35,
        duration: 800,
      }))

      // Record for 3.2 seconds
      await sleep(3200)
      if (cancelled) return

      // 3. Move smoothly to the green checkmark button
      const checkBtnPos = getTargetPos('[aria-label="Stop recording and transcribe to notes"]', recordBtnPos.x + 54, recordBtnPos.y + 38)
      setPointer({
        x: checkBtnPos.x,
        y: checkBtnPos.y,
        visible: true,
        clicked: false,
        duration: 750,
      })

      await sleep(850)
      if (cancelled) return

      // Click checkmark button
      setPointer((prev) => ({ ...prev, clicked: true }))
      await sleep(180)
      if (cancelled) return
      setPointer((prev) => ({ ...prev, clicked: false }))

      // 4. Transition to Phase 2: voice note shows Saved briefly, progress moves into Note
      setPhase(2)

      // Pointer glides smoothly along connecting line down to Notes editor
      const notesEditorPos = getTargetPos('.' + styles.notesEditorPanel, Math.round(containerRect.width * 0.45), Math.round(containerRect.height * 0.65))
      setPointer({
        x: notesEditorPos.x,
        y: notesEditorPos.y,
        visible: true,
        clicked: false,
        duration: 1100,
      })

      // In-note progress animates to 100% while pointer arrives at notes
      await sleep(2100)
      if (cancelled) return

      // 5. Transition to Phase 3: Attributed speaker notes populate editor, voice recorder resets to idle dial
      setPhase(3)

      await sleep(1100)
      if (cancelled) return

      // 6. Transition to Phase 4: Text highlighted + AI Chat open with summary
      setPhase(4)

      // Cursor moves to "Summarise this" button in the AI Chat modal
      const summariseBtnPos = getTargetPos('.' + styles.aiActionPill, notesEditorPos.x + 220, notesEditorPos.y - 30)
      setPointer({
        x: summariseBtnPos.x,
        y: summariseBtnPos.y,
        visible: true,
        clicked: false,
        duration: 750,
      })

      await sleep(850)
      if (cancelled) return

      // Click "Summarise this"
      setPointer((prev) => ({ ...prev, clicked: true }))
      await sleep(180)
      if (cancelled) return
      setPointer((prev) => ({ ...prev, clicked: false }))

      // Cursor rests aside and fades out
      await sleep(300)
      if (cancelled) return
      setPointer((prev) => ({
        ...prev,
        x: prev.x + 35,
        y: prev.y + 40,
        duration: 800,
      }))

      await sleep(1000)
      if (cancelled) return
      setPointer((prev) => ({ ...prev, visible: false }))
      // Animation completes and stays on Phase 4 - does NOT loop
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true
          observer.disconnect()
          runSequence()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [mounted])

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={styles.showcase}
      role="region"
      aria-label="ClearTab voice note to Attributed Speaker Notes and AI Summary"
    >
      {/* Non-interactive Virtual Pointer Cursor */}
      <VirtualCursor
        x={pointer.x}
        y={pointer.y}
        visible={pointer.visible}
        clicked={pointer.clicked}
        duration={pointer.duration}
      />

      {/* ── 1. TOP: voice note ON LEFT WITH CALLOUT ON RIGHT (media_1791939348896.png) ── */}
      <div className={styles.topContainer}>
        <div className={styles.recorderWrapper}>
          {/* Authentic ClearTab Voice notes Widget Box */}
          <div className={styles.recorderWidgetBox}>
            <div className={recorderStyles.container}>
              <div className={recorderStyles.content}>
                {/* Header */}
                <WidgetHeader
                  title={phase === 1 || phase === 2 ? 'Voice notes' : 'voice note'}
                  className="!justify-start"
                >
                  {phase === 1 && (
                    <div className={styles.headerRightStatus}>
                      <span className={styles.recordingDotPulse} />
                      <span>Recording</span>
                    </div>
                  )}
                  {phase === 2 && (
                    <div className={styles.headerRightStatus}>
                      <span className={styles.savedStatusText}>
                        <CheckIcon size={14} />
                        <span>Saved</span>
                      </span>
                    </div>
                  )}
                </WidgetHeader>

                {/* Card Body depending on phase */}
                {(phase === 0 || phase >= 3) && (
                  /* Authentic Idle State matching media_1791933069734.png */
                  <div className={recorderStyles.body}>
                    <div className={recorderStyles.buttonContainer}>
                      <div className={cn(recorderStyles.button, 'group')}>
                        <div
                          className={cn(
                            recorderStyles.buttonOuter,
                            pointer.clicked && phase === 0 && styles.buttonOuterActive
                          )}
                        >
                          {/* Main shading background */}
                          <div className={recorderStyles.buttonBackground} />

                          {/* Gradient border */}
                          <div className={recorderStyles.buttonBorder} />

                          {/* Top highlight for lighter upper half */}
                          <div className={recorderStyles.buttonTopHighlight} />

                          {/* Recording indicator dot (positioned top-center) */}
                          <div
                            className={cn(
                              recorderStyles.recordingDot,
                              pointer.clicked && phase === 0
                                ? recorderStyles.recordingDotHover
                                : ''
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <p className={recorderStyles.bodyText}>Start recording</p>
                  </div>
                )}

                {phase === 1 && (
                  /* Authentic Recording State matching media_1791933045265.png */
                  <div className={recorderStyles.recordingBody}>
                    <div className={recorderStyles.statusRow}>
                      <div className={recorderStyles.miniPulseDotRecording} />
                      <p className={recorderStyles.timer}>{formatTimer(recordSeconds)}</p>
                      <div className={recorderStyles.waveformContainer}>
                        {BASE_WAVE_HEIGHTS.map((baseH, i) => (
                          <div
                            key={i}
                            className={recorderStyles.waveformBar}
                            style={{
                              height: `${Math.max(4, Math.round(baseH * (0.6 + 0.4 * Math.sin(recordSeconds * 2 + i * 0.4))))}px`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className={recorderStyles.recordingControls}>
                      <Button size="icon" aria-label="Mute">
                        <MicIcon size={16} />
                      </Button>
                      <Button size="icon" aria-label="Pause">
                        <PauseIcon size={14} />
                      </Button>
                      <Button size="icon" variant="destructive" aria-label="Delete recording">
                        <TrashIcon size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="success"
                        aria-label="Stop recording and transcribe to notes"
                        className={cn(pointer.clicked && phase === 1 && styles.btnActive)}
                      >
                        <CheckIcon size={16} />
                      </Button>
                    </div>
                  </div>
                )}

                {phase === 2 && (
                  /* Saved State matching in-app widget (no timeline / waveform dots) */
                  <div className={styles.savedView}>
                    <div className={recorderStyles.transcriptionCompleteContainer}>
                      <div className={recorderStyles.transcriptionCompleteMessage}>
                        <CheckIcon size={16} className={recorderStyles.successCheckIcon} />
                        <span>Saved to Notes</span>
                      </div>
                      <div className={recorderStyles.successActionButtons}>
                        <Button size="sm">
                          Record new
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overlapping Callout Card on the Right (media_1791939348896.png) */}
          <div className={styles.calloutCardTop}>
            <div className={styles.calloutHeaderRow}>
              <span className={styles.calloutCategoryLabel}>voice note</span>
              <span className={styles.calloutBadge}>
                <SparkleIcon size={11} />
                <span>Instant Audio Capture</span>
              </span>
            </div>
            <h3 className={styles.calloutHeadline}>In person meetings</h3>
            <p className={styles.calloutText}>
              Speak naturally. ClearTab captures your audio in real time with private on-device recording, attributing speakers with zero latency and zero disruption to your flow.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. CONNECTING ANIMATED DASHED LINE (From top-left to bottom-right) ── */}
      <div className={styles.connectorContainer}>
        <svg className={styles.connectorSvg} viewBox="0 0 1000 120" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path
            d="M 280 10 C 380 70, 620 60, 740 115"
            stroke="url(#heroLineGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            className={styles.animatedDashes}
          />
        </svg>

        <div className={styles.linePill}>
          <span className={styles.linePillDot} />
          <span>Transcribing audio to notes...</span>
        </div>
      </div>

      {/* ── 3. BOTTOM: ATTRIBUTED SPEAKER NOTES & AI CHAT ON RIGHT (media_1791844087647.png) ── */}
      <div className={styles.bottomContainer}>
        <div className={styles.notesAiCluster}>
          {/* Floating Callout Bubble on the LEFT (media_1791844087647.png) */}
          <div className={styles.calloutBubbleLeft}>
            <p className={styles.calloutBubbleText}>
              You can highlight parts of the note and along with styling you can either explore the content with free local on-device AI or create tasks
            </p>
          </div>

          {/* Authentic Notes Widget */}
          <div className={styles.notesWidgetContainer}>
            <div className={styles.notesCard}>
              {/* Left Rail (Dates / Note list) */}
              <div className={styles.notesLeftRail}>
                <div className={styles.railDateItemActive}>
                  <span className={styles.railDateText}>13/10</span>
                  <span className={styles.railDateSnippet}>rainstorm...</span>
                </div>
                <div className={styles.railDateItem}>
                  <span className={styles.railDateText}>11/10</span>
                  <span className={styles.railDateSnippet}>n a swim...</span>
                </div>
                <div className={styles.railDateItem}>
                  <span className={styles.railDateText}>7/10</span>
                  <span className={styles.railDateSnippet}>efore Chri...</span>
                </div>
              </div>

              {/* Resizer Handle */}
              <div className={styles.resizableHandle} />

              {/* Editor Content Area */}
              <div className={styles.notesEditorPanel}>
                <div className={styles.notesEditorContent}>
                  {phase === 2 ? (
                    <div className={styles.inNoteTranscribingCard}>
                      <div className={styles.inNoteTranscribingHeader}>
                        <div className={styles.inNoteTranscribingTitle}>
                          <SparkleIcon size={13} />
                          <span>Transcribing voice note...</span>
                        </div>
                        <span className={styles.inNoteTranscribingBadge}>{transcribeProgress}%</span>
                      </div>
                      <div className={styles.inNoteProgressTrack}>
                        <div
                          className={styles.inNoteProgressFill}
                          style={{ width: `${transcribeProgress}%` }}
                        />
                      </div>
                      <p className={styles.inNoteTranscribingSubtitle}>
                        Attributing speakers and formatting notes...
                      </p>
                      <div className={styles.inNoteCreditsHint}>
                        <span>Free local transcription</span>
                        <span className={styles.inNoteCreditsLink}>1 credit remaining</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={styles.attributedNoteParagraph}>
                        <strong className={styles.speakerPrefix}>Speaker 1 (You):</strong> Great brainstorming session on the Q4 launch.
                      </p>
                      <p className={styles.attributedNoteParagraph}>
                        <strong className={styles.speakerPrefix}>Speaker 2 (Sam):</strong> I&apos;ll send Sam the slides by Friday, and{' '}
                        <span className={cn(styles.selectionText, phase >= 4 && styles.selectionTextActive)}>
                          need to book flights for Mum&apos;s birthday.
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Authentic AI Chat Drawer with Glowing Cyan Border (media_1791844087647.png) */}
          <div className={styles.aiChatModal}>
            {/* Modal Header */}
            <div className={styles.aiModalHeader}>
              <div className={styles.aiModalTitleGroup}>
                <span className={styles.aiModalTitle}>AI Chat</span>
                <ChevronDownIcon size={14} className={styles.aiChevronIcon} />
              </div>
              <div className={styles.aiDoneButton}>
                <span>Done</span>
                <span className={styles.aiEscKey}>Esc</span>
              </div>
            </div>

            {/* Selected Quote Reference */}
            <div className={styles.aiQuoteRow}>
              <div className={styles.aiQuoteBar} />
              <span className={styles.aiQuoteText}>need to book flights for Mum&apos;s birthday.</span>
            </div>

            {/* Prompt / Question */}
            <div className={styles.aiPromptRow}>
              <span className={styles.aiPromptLabel}>What would you like to do with this?</span>
              <div className={cn(styles.aiActionPill, pointer.clicked && phase === 4 && styles.aiActionPillActive)}>
                Summarise this
              </div>
            </div>

            {/* Thought Indicator */}
            <div className={styles.aiThoughtRow}>
              <SparkleIcon size={12} className={styles.aiThoughtIcon} />
              <span className={styles.aiThoughtText}>Thought for 1 second</span>
            </div>

            {/* AI Summary Output */}
            <div className={styles.aiSummaryCard}>
              <p className={styles.aiSummaryText}>
                Summary: You and Sam aligned on the Q4 launch &mdash;{' '}
                <strong>send Sam the slides by Friday</strong> and{' '}
                <strong>book flights for Mum&apos;s birthday</strong>.
              </p>
              <div className={styles.aiIconActionsRow}>
                <CopyIcon size={13} className={styles.aiIconBtn} />
                <RetryIcon size={13} className={styles.aiIconBtn} />
              </div>
            </div>

            {/* Follow-ups */}
            <div className={styles.aiFollowUpsSection}>
              <span className={styles.aiFollowUpsLabel}>Follow-ups</span>
              <div className={styles.aiFollowUpItem}>
                <span className={styles.aiFollowUpArrow}>&#x21b3;</span>
                <span className={styles.aiFollowUpText}>Make tasks from this</span>
              </div>
            </div>

            {/* About Context Chip */}
            <div className={styles.aiAboutChip}>
              <span className={styles.aiAboutLabel}>About</span>
              <span className={styles.aiAboutText}>Speaker 2 (Sam): I&apos;ll send Sam the slides by Fri...</span>
              <CloseIcon size={11} className={styles.aiAboutCloseIcon} />
            </div>

            {/* Input Composer Box */}
            <div className={styles.aiComposerBox}>
              <div className={styles.aiComposerPlaceholder}>Message...</div>
              <div className={styles.aiComposerBottomRow}>
                <div className={styles.aiComposerTags}>
                  <span className={styles.aiTag}>#task</span>
                  <span className={styles.aiTag}>#note</span>
                </div>
                <div className={styles.aiSendCircle}>
                  <ArrowUpIcon size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Explainer1
