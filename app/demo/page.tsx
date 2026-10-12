import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DemoDashboard } from '@/components/demo/demo-dashboard'

export const metadata: Metadata = {
  title: 'ClearTab demo',
  robots: { index: false, follow: false },
}

// The real dashboard with sample data, embedded in the landing page
export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoDashboard />
    </Suspense>
  )
}
