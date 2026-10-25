'use client'

// Dev-only harness to watch the hero Notes beats (write / format / ai) in the full
// LoginNotesWidget at card size. 404s in production; exposed by middleware only outside it.
import { notFound } from 'next/navigation'
import { LoginNotesWidget } from '@/components/widgets/login-notes-widget'

const BEATS = ['write', 'format', 'ai'] as const

export default function HeroBeatsPreview() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div
      style={{
        height: '100vh',
        overflowY: 'auto',
        background: '#0a0a0a',
        padding: 40,
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        color: '#fff',
      }}
    >
      {BEATS.map((beat) => (
        <div key={beat}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8, textTransform: 'capitalize' }}>
            {beat} beat
          </div>
          <div style={{ width: 460, height: 320, background: '#131313', borderRadius: 16, overflow: 'hidden' }}>
            <LoginNotesWidget active beat={beat} />
          </div>
        </div>
      ))}
    </div>
  )
}
