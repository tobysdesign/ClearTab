'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSettings } from '@/hooks/use-settings'

export function SkipOnboardingHandler() {
  const searchParams = useSearchParams()
  const { hasSeenOnboarding, completeOnboarding } = useSettings()
  
  useEffect(() => {
    const skipOnboarding = searchParams.get('skipOnboarding')
    const expandAll = searchParams.get('expandAll')
    
    if (skipOnboarding === 'true' && !hasSeenOnboarding) {
      // Complete onboarding with default values
      completeOnboarding({
        userName: 'User',
        agentName: 'Toby'
      })
    }
    
    // Force expand all widgets if requested
    if (expandAll === 'true') {
      setTimeout(() => {
        // Find all collapsed widgets and expand them
        const collapseButtons = document.querySelectorAll('[data-widget-collapsed="true"]')
        collapseButtons.forEach(button => {
          if (button instanceof HTMLElement) {
            button.click()
          }
        })
        
        // Also trigger any resize to full width
        const resizeHandles = document.querySelectorAll('.cursor-col-resize')
        resizeHandles.forEach(handle => {
          const event = new MouseEvent('mousedown', { bubbles: true, clientX: 500 })
          handle.dispatchEvent(event)
          setTimeout(() => {
            const upEvent = new MouseEvent('mouseup', { bubbles: true })
            document.dispatchEvent(upEvent)
          }, 100)
        })
      }, 1000)
    }
  }, [searchParams, hasSeenOnboarding, completeOnboarding])
  
  return null
}