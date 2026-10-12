import { LandingPage } from '@/components/landing/landing-page'

// The public landing page. The dashboard lives at /tab; the Chrome extension build serves
// it as its new tab page instead (scripts/build-extension.mjs).
export default function Home() {
  return <LandingPage />
}
