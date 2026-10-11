'use client'

import { LandingPage } from '@/components/landing/landing-page'
import TabPage from './tab/page'

// The web root is the public landing page; the dashboard lives at /tab.
// The Chrome extension's new tab loads index.html, so its build keeps the
// dashboard at the root.
const IS_EXTENSION = process.env.IS_EXTENSION === 'true'

export default function Home() {
  return IS_EXTENSION ? <TabPage /> : <LandingPage />
}
