"use client"

import { useState } from "react"
import { GoogleIcon } from "@/components/icons"
import { AppIcon } from "@/components/landing/app-icon"
import { siteUrl } from "@/lib/platform"
import { useAuth } from "./auth-context"
import styles from "./extension-sign-in.module.css"

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
        <p className={styles.subtitle}>Sign in to see your notes, tasks and calendar in every new tab.</p>

        <button type="button" className={styles.primaryButton} onClick={() => start(false)} disabled={busy}>
          <GoogleIcon size={16} />
          {busy ? "Finish signing in in the window…" : "Sign in with Google"}
        </button>
        <button type="button" className={styles.linkButton} onClick={() => start(true)} disabled={busy}>
          Use a different account
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
