'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import {
  CalendarIcon,
  MicIcon,
  CloudSunIcon,
  TimerIcon,
  LayoutIcon,
  KeyboardIcon,
  ChipIcon,
  BrowserTabIcon,
  ShieldIcon,
  AddIcon,
} from '@/components/icons'
import { HeroDemo } from './hero-demo'
import { AppIcon } from './app-icon'
import { NotesDemo, TasksDemo, ScheduleDemo, AskDemo, LayoutsDemo, CalendarsDemo, DockDemo } from './demos'
import styles from './landing-page.module.css'

const FEATURES = [
  { icon: CalendarIcon, title: 'Every calendar.', body: 'Connect more than one Google account and see work and personal events in one schedule. Read-only, always.' },
  { icon: LayoutIcon, title: 'Five layouts.', body: 'Notetaker, Even, Taskmaster, Minimal, or a custom arrangement you build by dragging widgets around.' },
  { icon: BrowserTabIcon, title: 'Only what you use.', body: 'Switch any widget off and the rest of the dashboard fills the space.' },
  { icon: KeyboardIcon, title: 'Dock anywhere.', body: 'Bottom, top, left or right. ⌘K opens chat; #task and #note add things without the mouse.' },
  { icon: TimerIcon, title: 'Countdowns.', body: 'Birthdays, launches and holidays, counted down one dot at a time.' },
  { icon: CloudSunIcon, title: 'Weather.', body: 'Now and the next five days for the city you choose.' },
  { icon: MicIcon, title: 'Voice memos.', body: 'Press record, say it out loud, and get a transcribed note back.' },
  { icon: ChipIcon, title: 'On-device AI.', body: "Chat runs on Chrome's built-in Gemini Nano. No AI account, no API key." },
  { icon: ShieldIcon, title: 'No ads, no trackers.', body: 'No advertising and no analytics scripts. Your data is never sold.' },
]

const FAQS = [
  {
    q: 'What is ClearTab?',
    a: 'A calm dashboard for your new tab: notes, tasks, your Google Calendar, the weather, countdowns and voice memos in one place, with an AI chat that knows what you wrote down.',
  },
  {
    q: 'What does ClearTab do with my Google Calendar?',
    a: "It reads today's events so it can show your schedule. Access is read-only, so ClearTab can't create, change or delete anything. You can disconnect in Settings or remove access from your Google Account at any time.",
  },
  {
    q: 'Can I connect more than one calendar?',
    a: 'Yes. Sign in with one Google account, then add others in Settings, such as work and personal. Their events appear together in the Schedule widget, and you can hide any account with a switch.',
  },
  {
    q: 'Can the AI make tasks for me?',
    a: "Yes. Choose Make tasks with AI on any note, or highlight some text and ask the AI. It suggests tasks with priorities and due dates, and you choose which to add. You can also highlight a line and press + Task to add it straight away.",
  },
  {
    q: 'Can I change the layout?',
    a: "Yes. Open the layout panel from the dock to pick Notetaker, Even, Taskmaster or Minimal, or drag widgets to swap and split them into your own layout. You can turn widgets off, and drag the dock to any edge of the screen.",
  },
  {
    q: 'Where are my notes and tasks stored?',
    a: 'In ClearTab’s database, so they follow you between devices. They are only used to run ClearTab for you.',
  },
  {
    q: 'Does the AI chat send my data anywhere?',
    a: "No. Chat runs on Gemini Nano, the model built into Chrome, so your questions and the notes it reads stay on your device. It needs desktop Chrome 138 or later.",
  },
  {
    q: 'How do voice memos work?',
    a: "Your recording is sent to Google's Gemini API to be transcribed, and the text is saved as a note. ClearTab doesn't keep the audio.",
  },
  {
    q: 'Which browsers does it work in?',
    a: 'Any modern browser for the web app. The AI chat needs desktop Chrome, and the Chrome extension is coming soon.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Settings lets you delete all your notes and tasks and disconnect your calendar. The privacy policy explains how to delete your account entirely.',
  },
]

/* Fades sections in as they enter the viewport and starts their demos */
function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.setAttribute('data-visible', 'true')
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  return rootRef
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.faqItem} data-open={open}>
      <h3 className={styles.faqHeading}>
        <button type="button" className={styles.faqButton} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <AddIcon size={18} className={styles.faqIcon} />
          <span>{q}</span>
        </button>
      </h3>
      <div className={styles.faqPanel}>
        <div className={styles.faqPanelInner}>
          <p className={styles.faqAnswer}>{a}</p>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const { user, signIn } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const rootRef = useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const primaryCta = user ? (
    <Link href="/tab" className={styles.primaryButton}>Open ClearTab</Link>
  ) : (
    <button type="button" className={styles.primaryButton} onClick={() => signIn('google')}>
      <GoogleMark />
      Sign in with Google
    </button>
  )

  return (
    <div ref={rootRef} className={styles.page}>
      <header className={styles.navWrap} data-scrolled={scrolled}>
        <nav className={styles.nav} aria-label="Main">
          <Link href="/" className={styles.logo} aria-label="ClearTab home">
            <AppIcon size={30} />
            <span>cleartab.</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#customise" className={styles.navLink}>Customise</a>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#ask" className={styles.navLink}>AI chat</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
            {user ? (
              <Link href="/tab" className={styles.navButton}>Open ClearTab</Link>
            ) : (
              <button type="button" className={styles.navButton} onClick={() => signIn('google')}>Sign in</button>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <AppIcon size={72} className={`${styles.heroMark} ${styles.enter1}`} />
          <h1 className={styles.heroTitle}>
            <span className={`${styles.strong} ${styles.enter1}`}>Your new tab, finally useful. </span>
            <span className={`${styles.muted} ${styles.enter2}`}>
              Notes, tasks and every calendar you use, in one calm dashboard you can arrange however you like.
            </span>
          </h1>
          <div className={`${styles.heroActions} ${styles.enter3}`}>
            {primaryCta}
            <a href="#features" className={styles.secondaryButton}>See how it works</a>
          </div>
          <p className={`${styles.heroNote} ${styles.enter3}`}>Chrome extension coming soon</p>

          <div className={`${styles.heroStage} ${styles.enter4}`}>
            <div className={styles.heroDemo}>
              <HeroDemo />
            </div>
          </div>
        </section>

        {/* Make it yours */}
        <section id="customise" className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.reveal}`} data-reveal>
            <span className={styles.strong}>Make it yours. </span>
            <span className={styles.muted}>Five layouts, every calendar you use, and a dock that goes wherever you want it.</span>
          </h2>
          <figure className={`${styles.demo} ${styles.wideDemo} ${styles.reveal}`} data-reveal>
            <LayoutsDemo />
            <figcaption className={`${styles.caption} ${styles.wideCaption}`}>
              <span className={styles.strong}>Layouts. </span>
              <span className={styles.muted}>
                Start from Notetaker, Even, Taskmaster or Minimal, or drag widgets to swap and split them into an arrangement
                of your own. Switch off anything you don&apos;t need.
              </span>
            </figcaption>
          </figure>
          <div className={`${styles.pairGrid} ${styles.reveal}`} data-reveal>
            <figure className={styles.demo}>
              <CalendarsDemo />
              <figcaption className={styles.caption}>
                <span className={styles.strong}>All your calendars. </span>
                <span className={styles.muted}>
                  Connect work and personal Google accounts and see every event in one schedule. Hide any account with a switch.
                </span>
              </figcaption>
            </figure>
            <figure className={styles.demo}>
              <DockDemo />
              <figcaption className={styles.caption}>
                <span className={styles.strong}>Dock anywhere. </span>
                <span className={styles.muted}>Drag the dock to the bottom, the top or either side, wherever your hand goes first.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* At a glance */}
        <section id="features" className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.reveal}`} data-reveal>
            <span className={styles.strong}>Everything at a glance. </span>
            <span className={styles.muted}>Write it down, tick it off, and see what&apos;s next without opening another app.</span>
          </h2>
          <div className={`${styles.demoGrid} ${styles.reveal}`} data-reveal>
            <figure className={styles.demo}>
              <NotesDemo />
              <figcaption className={styles.caption}>
                <span className={styles.strong}>Notes. </span>
                <span className={styles.muted}>Catch the thought before it goes. Everything saves as you type.</span>
              </figcaption>
            </figure>
            <figure className={styles.demo}>
              <TasksDemo />
              <figcaption className={styles.caption}>
                <span className={styles.strong}>Tasks. </span>
                <span className={styles.muted}>Turn a note into tasks with on-device AI, or highlight a line and make it one. Priorities and due dates included.</span>
              </figcaption>
            </figure>
            <figure className={styles.demo}>
              <ScheduleDemo />
              <figcaption className={styles.caption}>
                <span className={styles.strong}>Schedule. </span>
                <span className={styles.muted}>Today from your Google Calendar, with what&apos;s on now right where you look.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* AI chat */}
        <section id="ask" className={`${styles.section} ${styles.askSection}`}>
          <div className={`${styles.askCopy} ${styles.reveal}`} data-reveal>
            <div className={styles.keys} aria-hidden="true">
              <kbd className={styles.key}>⌘</kbd>
              <kbd className={styles.key}>K</kbd>
            </div>
            <h2 className={styles.sectionTitle}>
              <span className={styles.strong}>Ask your dashboard. </span>
              <span className={styles.muted}>
                Press ⌘K and ask what&apos;s due, what&apos;s next or what you wrote down last week. It runs on the AI
                built into Chrome, so your questions never leave your device.
              </span>
            </h2>
          </div>
          <div className={`${styles.askDemo} ${styles.reveal}`} data-reveal>
            <AskDemo />
          </div>
        </section>

        {/* Feature grid */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.reveal}`} data-reveal>
            <span className={styles.strong}>Calm by design. </span>
            <span className={styles.muted}>Only what's worth seeing on a new tab, arranged the way you like it.</span>
          </h2>
          <div className={styles.featureGrid}>
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className={`${styles.feature} ${styles.reveal}`} data-reveal>
                <Icon size={32} className={styles.featureIcon} />
                <p className={styles.featureText}>
                  <span className={styles.strong}>{title} </span>
                  <span className={styles.muted}>{body}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${styles.section} ${styles.faqSection}`}>
          <h2 className={`${styles.faqTitle} ${styles.reveal}`} data-reveal>Questions? Answers.</h2>
          <div className={`${styles.faqList} ${styles.reveal}`} data-reveal>
            {FAQS.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className={`${styles.section} ${styles.closing} ${styles.reveal}`} data-reveal>
          <h2 className={styles.closingTitle}>
            <span className={styles.strong}>Make every new tab count.</span>
          </h2>
          <div className={styles.heroActions}>{primaryCta}</div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMeta}>
          <p>Made in Sydney.</p>
          <p>©{new Date().getFullYear()} ClearTab</p>
        </div>
        <div className={styles.footerColumns}>
          <div className={styles.footerColumn}>
            <p className={styles.footerHeading}>ClearTab</p>
            <Link href="/tab">Open the app</Link>
            <a href="#features">Features</a>
            <a href="#ask">AI chat</a>
          </div>
          <div className={styles.footerColumn}>
            <p className={styles.footerHeading}>Information</p>
            <a href="#faq">FAQs</a>
            <Link href="/privacy">Privacy policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
