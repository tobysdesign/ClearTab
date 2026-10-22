"use client"

import { useState } from "react"
import { GoogleIcon, PenIcon, CheckIcon, CalendarIcon, ShieldIcon } from "@/components/icons"
import { AppIcon } from "@/components/landing/app-icon"
import { siteUrl } from "@/lib/platform"
import { useAuth } from "./auth-context"
import styles from "./extension-sign-in.module.css"

// What you get once signed in — the "why".
const VALUE = [
  { Icon: PenIcon, label: "Notes", desc: "Jot things down, always a tab away" },
  { Icon: CheckIcon, label: "Tasks", desc: "Keep track of what's due" },
  { Icon: CalendarIcon, label: "Schedule", desc: "Your Google Calendar at a glance" },
]

// What Google access is requested — the "what". Mirrors the OAuth scopes:
// openid/email/profile + calendar.readonly.
const ACCESS = [
  {
    Icon: GoogleIcon,
    text: "Your Google name and email — to create your account and sync across your devices.",
  },
  {
    Icon: CalendarIcon,
    text: "Your calendar, read-only — to show your schedule. ClearTab can't change your calendar or send email.",
  },
]

// The extension's new tab while signed out
export function ExtensionSignIn() {
  const { signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async (fresh: boolean) => {
    setBusy(true)
    setError(null)
    try {
      await signIn("google", { fresh })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AppIcon size={72} />
        <h1 className={styles.title}>ClearTab</h1>
        <p className={styles.subtitle}>
          Every new tab becomes your dashboard — your notes, tasks and schedule in one place.
        </p>

        <ul className={styles.valueList}>
          {VALUE.map(({ Icon, label, desc }) => (
            <li key={label} className={styles.valueItem}>
              <span className={styles.valueIcon} aria-hidden>
                <Icon size={16} />
              </span>
              <span className={styles.valueText}>
                <strong>{label}</strong> — {desc}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.access}>
          <p className={styles.accessTitle}>What you're signing into</p>
          {ACCESS.map(({ Icon, text }) => (
            <div key={text} className={styles.accessRow}>
              <span className={styles.accessIcon} aria-hidden>
                <Icon size={14} />
              </span>
              <span className={styles.accessText}>{text}</span>
            </div>
          ))}
          <p className={styles.accessNote}>
            <ShieldIcon size={13} />
            Your notes, tasks and calendar stay private to you.
          </p>
        </div>

        <button type="button" className={styles.primaryButton} onClick={() => start(false)} disabled={busy}>
          <GoogleIcon size={16} />
          {busy ? "Finish signing in in the window…" : "Sign in with Google"}
        </button>
        <button type="button" className={styles.linkButton} onClick={() => start(true)} disabled={busy}>
          Sign in with a different account
        </button>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <a className={styles.footerLink} href={siteUrl("/privacy")} target="_blank" rel="noreferrer">
        Privacy
      </a>
    </div>
  )
}
