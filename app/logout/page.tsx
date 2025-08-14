'use client'

import { useEffect } from 'react'

export default function LogoutPage() {
  useEffect(() => {
    console.log('Logout page mounted')
    
    // Immediately call the logout API
    const performLogout = async () => {
      console.log('Starting logout process...')
      
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Logout API response:', response.status)
        const data = await response.json()
        console.log('Logout API data:', data)
      } catch (error) {
        console.error('Logout API error:', error)
      }
      
      // Always redirect after a short delay to ensure logout completes
      console.log('Redirecting to login...')
      setTimeout(() => {
        // Use multiple methods to ensure redirect happens
        window.location.replace('/login')
        window.location.href = '/login'
        // Force reload if still on same page after 100ms
        setTimeout(() => {
          if (window.location.pathname === '/logout') {
            window.location.reload()
          }
        }, 100)
      }, 500)
    }
    
    performLogout()
    
    // Absolute fallback - redirect after 3 seconds no matter what
    const absoluteFallback = setTimeout(() => {
      console.log('Absolute fallback: forcing redirect to login')
      window.location.replace('/login')
    }, 3000)
    
    return () => clearTimeout(absoluteFallback)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you out...</h1>
        <p className="text-white">Please wait while we clear your session.</p>
        <p className="text-sm text-white/60 mt-4">If you're not redirected in a few seconds, <a href="/login" className="underline">click here</a>.</p>
      </div>
    </div>
  )
}
