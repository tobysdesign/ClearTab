'use client'

/**
 * Scripted "beat" demos for the hero Notes card. Each plays only while the
 * camera is holding on its card (`active`) and rests on a finished state
 * otherwise, so the 32-card grid isn't animating all at once.
 *
 * - FormatNote: select a few lines → the bubble toolbar fades in → the list
 *   control activates → the lines turn into a bulleted list.
 * - AiNote (later): select text → bubble toolbar → ✨ → a compact mock of the
 *   app's AI chat modal appears with a thinking beat then a response.
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import notesStyles from './notes-widget.module.css'
import styles from './login-notes-beats.module.css'

/** Drives a looping phase machine while `active`, resetting to phase 0 when not. */
function usePhases(active: boolean, durations: number[]) {
  const [phase, setPhase] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) {
      if (timer.current) clearTimeout(timer.current)
      setPhase(0)
      return
    }
    const next = () => {
      setPhase((p) => {
        const np = (p + 1) % durations.length
        timer.current = setTimeout(next, durations[np])
        return np
      })
    }
    timer.current = setTimeout(next, durations[0])
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [active, durations])

  return phase
}

const FORMAT_LINES = ['Flights to Tokyo', 'Hotel in Shibuya', 'JR Rail pass', 'Day trip to Hakone']

// Phase timeline (ms spent IN each phase): 0 plain, 1 selected, 2 toolbar, 3 listed, 4 hold.
const FORMAT_DURATIONS = [500, 500, 450, 700, 1100]

export function FormatNote({ active = false }: { active?: boolean }) {
  const phase = usePhases(active, FORMAT_DURATIONS)
  const selected = phase >= 1 && phase <= 3
  const toolbar = phase >= 2 && phase <= 3
  const listed = phase >= 3

  return (
    <>
      <div className={notesStyles.notesEditorHeader}>
        <div className={notesStyles.notesHeaderContent}>
          <div className={notesStyles.notesTitleContainer}>
            <div className={notesStyles.notesTitleInput}>Japan trip</div>
          </div>
        </div>
      </div>
      <div className={notesStyles.notesEditorScroll}>
        <div className={cn(notesStyles.notesEditorContainer, styles.beatBody)}>
          <div className={cn(styles.lines, selected && styles.linesSelected)}>
            {/* Bubble toolbar floats above the selection */}
            <div className={cn(styles.bubbleToolbar, toolbar && styles.bubbleToolbarShown)} aria-hidden>
              <span className={styles.bubbleBtn}>B</span>
              <span className={cn(styles.bubbleBtn, styles.bubbleBtnItalic)}>i</span>
              <span className={styles.bubbleBtn}>H</span>
              <span className={cn(styles.bubbleBtn, styles.bubbleBtnList, listed && styles.bubbleBtnActive)}>
                <span className={styles.listGlyphRow} />
                <span className={styles.listGlyphRow} />
                <span className={styles.listGlyphRow} />
              </span>
            </div>

            {FORMAT_LINES.map((line) => (
              <div key={line} className={cn(styles.line, listed && styles.lineBulleted)}>
                <span className={cn(styles.bullet, listed && styles.bulletShown)} />
                <span className={styles.lineText}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// Phase timeline: 0 plain, 1 selected, 2 toolbar(✨), 3 modal+thinking, 4 response, 5 hold.
const AI_DURATIONS = [600, 500, 500, 900, 800, 1300]

export function AiNote({ active = false }: { active?: boolean }) {
  const phase = usePhases(active, AI_DURATIONS)
  const selected = phase >= 1 && phase <= 2
  const toolbar = phase === 2
  const modalOpen = phase >= 3
  const thinking = phase === 3
  const responded = phase >= 4

  return (
    <div className={styles.aiWrap}>
      <div className={notesStyles.notesEditorHeader}>
        <div className={notesStyles.notesHeaderContent}>
          <div className={notesStyles.notesTitleContainer}>
            <div className={notesStyles.notesTitleInput}>Weekly sync</div>
          </div>
        </div>
      </div>
      <div className={notesStyles.notesEditorScroll}>
        <div className={cn(notesStyles.notesEditorContainer, styles.beatBody)}>
          <div className={styles.aiText}>
            {/* Bubble toolbar with the AI (✨) control active */}
            <div className={cn(styles.bubbleToolbar, styles.bubbleToolbarAi, toolbar && styles.bubbleToolbarShown)} aria-hidden>
              <span className={styles.bubbleBtn}>B</span>
              <span className={cn(styles.bubbleBtn, styles.bubbleBtnItalic)}>i</span>
              <span className={styles.bubbleDivider} />
              <span className={cn(styles.bubbleBtn, styles.bubbleBtnActive)}>✨</span>
            </div>

            Catch-up with Sam. Email Priya the invoice and{' '}
            <span className={cn(styles.aiPhrase, selected && styles.aiPhraseSelected)}>
              book flights for Mum&rsquo;s birthday
            </span>
            .
          </div>
        </div>
      </div>

      {/* Compact mock of the app's AI chat modal, sliding up over the note */}
      <div className={cn(styles.aiModal, modalOpen && styles.aiModalOpen)} aria-hidden>
        <div className={styles.aiModalHeader}>
          <span className={styles.aiModalSpark}>✨</span>
          <span className={styles.aiModalTitle}>AI</span>
        </div>
        <div className={styles.aiQuote}>book flights for Mum&rsquo;s birthday</div>
        {thinking && (
          <div className={styles.aiThinking}>
            <span className={styles.aiDot} />
            <span className={cn(styles.aiDot, styles.aiDot2)} />
            <span className={cn(styles.aiDot, styles.aiDot3)} />
          </div>
        )}
        {responded && (
          <div className={styles.aiReply}>I spotted 2 to-dos in that — want me to add them as tasks?</div>
        )}
      </div>
    </div>
  )
}
