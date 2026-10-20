import type { Metadata } from 'next'
import Link from 'next/link'
import { AppIcon } from '@/components/landing/app-icon'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Privacy policy · ClearTab',
  description: 'What ClearTab collects, why, and how to remove it.',
}

const OPERATOR = 'Tobys Design'
const CONTACT_EMAIL = 'admin@tobys.design'
const LAST_UPDATED = '13 October 2026'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="ClearTab home">
          <AppIcon size={30} />
          <span>cleartab.</span>
        </Link>
      </header>

      <main className={styles.content}>
        <h1 className={styles.title}>Privacy policy</h1>
        <p className={styles.updated}>Last updated {LAST_UPDATED}</p>

        <p className={styles.lead}>
          ClearTab is a personal dashboard for your browser&apos;s new tab. This policy explains what we collect, why,
          who it&apos;s shared with, and how to remove it. ClearTab is run by {OPERATOR}, based in Sydney, Australia
          (&quot;we&quot;, &quot;us&quot;).
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your Google account basics.</strong> When you sign in with Google we receive your name, email address and
            profile picture. We use them to create your account and show who&apos;s signed in.
          </li>
          <li>
            <strong>Google Calendar access.</strong> With your permission we use the read-only Google Calendar scope
            (<code>calendar.readonly</code>) to show your own upcoming events in the schedule widget. We only read your
            calendar — we never create, change or delete events. We store the access tokens Google gives us so your schedule
            keeps working, and the list of your calendars so you can choose which ones to show. We fetch events when you open
            your dashboard and don&apos;t keep a copy of them.
          </li>
          <li>
            <strong>Things you create.</strong> Your notes, tasks, countdowns and settings (such as your layout and weather
            location) are stored so they&apos;re there on every device you sign in on.
          </li>
          <li>
            <strong>Voice notes.</strong> When you record a voice note, the audio is sent to transcribe it and the text is saved
            as a note. We don&apos;t keep the audio.
          </li>
          <li>
            <strong>Browser storage.</strong> ClearTab keeps a few preferences in your browser (for example your dock position)
            and uses cookies to keep you signed in. We don&apos;t use advertising or analytics cookies.
          </li>
        </ul>

        <h2>What we don&apos;t do</h2>
        <ul>
          <li>We don&apos;t sell your data or share it for advertising.</li>
          <li>We don&apos;t run analytics or tracking scripts.</li>
          <li>We don&apos;t use your data to train AI models.</li>
        </ul>

        <h2>AI chat</h2>
        <p>
          The AI chat runs on Gemini Nano, the model built into Google Chrome. Your questions, and the notes, tasks and
          schedule it reads to answer them, are processed on your device and aren&apos;t sent to us or to an AI provider.
          Chat conversations aren&apos;t saved. voice notes use Google Gemini to transcribe your recording into text, which is
          saved as a note; the audio itself isn&apos;t kept.
        </p>

        <h2>Who processes your data</h2>
        <p>We use a small number of providers to run ClearTab. Each only receives what it needs:</p>
        <ul>
          <li><strong>Google</strong>: sign-in, Google Calendar, weather data, and transcription of voice notes (Gemini API).</li>
          <li><strong>Supabase</strong>: our database, which stores your account, notes, tasks and settings.</li>
          <li><strong>Vercel</strong>: hosts the ClearTab website and app.</li>
        </ul>
        <p>These providers may store data outside Australia, including in Singapore and the United States.</p>

        <h2>Google user data</h2>
        <p>
          ClearTab&apos;s use and transfer of information received from Google APIs adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We request read-only access (the <code>calendar.readonly</code> scope)
          and use your Google Calendar data solely to show your own upcoming events in ClearTab&apos;s schedule widget. We
          never sell this data or use it for advertising, and we don&apos;t transfer it to others except as needed to provide
          that feature, for security, or to comply with the law; no human reads it unless you ask us to for support.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep your data while your account is active. When you delete a note or task, it&apos;s removed from our database
          immediately (your browser holds a temporary copy for a few seconds so you can undo an accidental delete, after which
          it&apos;s gone). If you ask us to delete your account, we delete your data within 30 days.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Download your notes and tasks from Settings to use outside ClearTab, or delete all of them at any time.</li>
          <li>
            Disconnect Google Calendar in Settings, or remove ClearTab&apos;s access from your{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
          </li>
          <li>
            To get a copy of your data, correct it, or delete your account, email {CONTACT_EMAIL}. You can also contact the
            Office of the Australian Information Commissioner if you&apos;re unhappy with how we handle a request.
          </li>
        </ul>

        <h2>Security</h2>
        <p>
          Data is encrypted in transit, and access to our database is restricted. No service is perfectly secure, but we take
          reasonable steps to protect your information.
        </p>

        <h2>Children</h2>
        <p>ClearTab isn&apos;t intended for children under 13, and we don&apos;t knowingly collect their information.</p>

        <h2>Changes</h2>
        <p>
          If we change this policy we&apos;ll update the date above, and for significant changes we&apos;ll let you know in
          the app.
        </p>

        <h2>Contact</h2>
        <p>Questions about your privacy? Email {CONTACT_EMAIL}.</p>

        <p className={styles.back}>
          <Link href="/">← Back to ClearTab</Link>
        </p>
      </main>
    </div>
  )
}
