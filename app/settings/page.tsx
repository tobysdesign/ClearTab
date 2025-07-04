'use client'

import { useRouter } from 'next/navigation'
import { SettingsModal } from '@/components/settings/settings-modal'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <SettingsModal 
      open={true} 
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }} 
    />
  )
}