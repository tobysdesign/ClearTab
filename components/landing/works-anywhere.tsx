'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { BriefcaseIcon, BrowserTabIcon, CheckIcon, CopyIcon, HomeIcon, PhoneIcon } from '@/components/icons'
import styles from './works-anywhere.module.css'

/*
 * "Works anywhere": where ClearTab runs (Chrome new tab, any browser's homepage, phone,
 * work computer), then step-by-step homepage setup for the visitor's browser, picked
 * automatically and switchable.
 */

const DASHBOARD_URL = 'cleartab.app/tab'

type BrowserId = 'chrome' | 'safari' | 'firefox' | 'edge' | 'iphone' | 'android'

const Url = () => <code className={styles.inlineUrl}>{DASHBOARD_URL}</code>

const BROWSERS: { id: BrowserId; label: string; steps: ReactNode[]; note?: string }[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    steps: [
      <>Open <b>Settings</b> and go to <b>On start-up</b>.</>,
      <>Choose <b>Open a specific page or set of pages</b> and add <Url />.</>,
      <>For one-click return, turn on <b>Appearance › Show Home button</b> and set it to <Url />.</>,
    ],
    note: 'To make it your new tab page too, add the ClearTab extension (coming soon).',
  },
  {
    id: 'safari',
    label: 'Safari',
    steps: [
      <>Open <b>Safari › Settings</b> and go to <b>General</b>.</>,
      <>Set <b>Homepage</b> to <Url />.</>,
      <>Set <b>New windows open with</b> and <b>New tabs open with</b> to <b>Homepage</b>.</>,
    ],
  },
  {
    id: 'firefox',
    label: 'Firefox',
    steps: [
      <>Open <b>Settings</b> and go to <b>Home</b>.</>,
      <>Under <b>Homepage and new windows</b>, choose <b>Custom URLs</b>.</>,
      <>Enter <Url />.</>,
    ],
  },
  {
    id: 'edge',
    label: 'Edge',
    steps: [
      <>Open <b>Settings</b> and go to <b>Start, home, and new tabs</b>.</>,
      <>Under <b>When Edge starts</b>, choose <b>Open these pages</b>.</>,
      <>Select <b>Add a new page</b> and enter <Url />.</>,
    ],
  },
  {
    id: 'iphone',
    label: 'iPhone',
    steps: [
      <>Open <Url /> in Safari and sign in.</>,
      <>Tap <b>Share</b>, then <b>Add to Home Screen</b>.</>,
      <>Open ClearTab from your home screen, like any other app.</>,
    ],
  },
  {
    id: 'android',
    label: 'Android',
    steps: [
      <>Open <Url /> in Chrome and sign in.</>,
      <>Tap <b>⋮</b>, then <b>Add to Home screen</b> or <b>Install app</b>.</>,
      <>Open ClearTab from your home screen, like any other app.</>,
    ],
  },
]

function detectBrowser(ua: string): BrowserId {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iphone'
  if (/Android/.test(ua)) return 'android'
  if (/Edg\//.test(ua)) return 'edge'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua)) return 'safari'
  return 'chrome'
}

const CARD_ICONS = [BrowserTabIcon, HomeIcon, PhoneIcon, BriefcaseIcon]

interface WorksAnywhereProps {
  /** In order: Chrome new tab, any browser's homepage, phone, work computer */
  cards: { title: string; body: string }[]
  homepageIntro: string
}

export function WorksAnywhere({ cards, homepageIntro }: WorksAnywhereProps) {
  const [browser, setBrowser] = useState<BrowserId>('chrome')
  const [copied, setCopied] = useState(false)

  // After mount, so the server render and first client render agree
  useEffect(() => {
    setBrowser(detectBrowser(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${DASHBOARD_URL}`)
      setCopied(true)
    } catch {
      // Clipboard blocked: the address is right there to type
    }
  }

  const current = BROWSERS.find((b) => b.id === browser) ?? BROWSERS[0]

  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {cards.map(({ title, body }, i) => {
          const Icon = CARD_ICONS[i] ?? BrowserTabIcon
          return (
            <div key={title} className={styles.card}>
              <Icon size={32} className={styles.cardIcon} />
              <p className={styles.cardText}>
                <span className={styles.strong}>{title} </span>
                <span className={styles.muted}>{body}</span>
              </p>
            </div>
          )
        })}
      </div>

      <div className={styles.setup}>
        <div className={styles.setupHead}>
          <p className={styles.setupIntro}>{homepageIntro}</p>
          <div className={styles.urlChip}>
            <span className={styles.urlText}>{DASHBOARD_URL}</span>
            <button type="button" className={styles.copyButton} onClick={copyUrl} aria-label="Copy the ClearTab address">
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className={styles.picker} role="group" aria-label="Your browser">
          {BROWSERS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={styles.pickerButton}
              aria-pressed={b.id === browser}
              onClick={() => setBrowser(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <ol className={styles.steps} aria-live="polite">
          {current.steps.map((step, i) => (
            <li key={`${current.id}-${i}`} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {current.note && <p className={styles.note}>{current.note}</p>}
      </div>
    </div>
  )
}
