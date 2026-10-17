"use client"
import * as React from "react"
import styles from "./transcription-choice.module.css"
import { isValidGeminiKey, type TranscriptionEngine } from "@/lib/transcription-config"

interface Props {
  hasKey: boolean
  savedEngine?: TranscriptionEngine
  onChoose: (engine: TranscriptionEngine, geminiKey?: string) => void
  onCancel?: () => void
}

export const ENGINE_LABELS: Record<TranscriptionEngine, string> = {
  gemini: "Gemini",
  "local-en": "on-device English",
  "local-multi": "on-device multilingual",
}

const OPTIONS: { engine: TranscriptionEngine; title: string; sub: string }[] = [
  { engine: "gemini", title: "Gemini (cloud) — with API key", sub: "Speaker detection + long recordings, on your key." },
  { engine: "local-en", title: "On device — English only", sub: "Private & free. One-time ~40MB download." },
  { engine: "local-multi", title: "On device — Multilingual", sub: "Private & free. One-time ~80MB download." },
]

export function TranscriptionChoice({ hasKey, savedEngine, onChoose, onCancel }: Props) {
  const [showKey, setShowKey] = React.useState(false)
  const [key, setKey] = React.useState("")

  if (showKey) {
    return (
      <div className={styles.card} data-testid="gemini-onboarding">
        <h3 className={styles.title}>Add your Gemini key</h3>
        <p className={styles.sub}>
          Cloud transcription uses your own Google key — your recordings run on your quota.
          Get a free key from{" "}
          <a className={styles.link} href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>.
        </p>
        <input
          className={styles.input} type="password" placeholder="AIza…" value={key}
          autoComplete="off" spellCheck={false} onChange={(e) => setKey(e.target.value)}
          data-testid="gemini-key-input" aria-label="Gemini API key"
        />
        <div className={styles.row}>
          <button type="button" className={styles.secondary} onClick={() => setShowKey(false)}>
            Use on-device instead
          </button>
          <button
            type="button" className={styles.primary} disabled={!isValidGeminiKey(key)}
            onClick={() => onChoose("gemini", key.trim())} data-testid="gemini-key-save"
          >Transcribe</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card} data-testid="transcription-choice">
      <h3 className={styles.title}>How should we transcribe this?</h3>
      {OPTIONS.map((o) => (
        <button
          type="button"
          key={o.engine}
          className={o.engine === savedEngine ? `${styles.option} ${styles.optionSelected}` : styles.option}
          data-testid={`choice-${o.engine}`}
          onClick={() => (o.engine === "gemini" && !hasKey ? setShowKey(true) : onChoose(o.engine))}
        >
          <span className={styles.optionTitle}>{o.title}</span>
          <span className={styles.optionSub}>{o.sub}</span>
        </button>
      ))}
      {onCancel ? (
        <button type="button" className={styles.secondary} onClick={onCancel} data-testid="choice-cancel">Cancel</button>
      ) : null}
    </div>
  )
}
