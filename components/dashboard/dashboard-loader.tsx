'use client'

import dynamic from 'next/dynamic'

// Dynamically import the main dashboard component with SSR disabled
const DashboardClient = dynamic(() => import('@/components/dashboard/dashboard-client'), { ssr: false })

export default function DashboardLoader() {
  return <DashboardClient />
} 