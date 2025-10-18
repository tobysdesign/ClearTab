/**
 * Chrome Authentication Provider
 * Semantic markup with zero presentation logic
 */

import React from 'react'
import { useAuth } from '../utils/chrome-auth'
import { ExtensionAuthPage } from './ExtensionAuthPage'
import { BrandedLoader } from '@/components/ui/branded-loader'

interface ChromeAuthProviderProps {
  children: React.ReactNode
}

export function ChromeAuthProvider({ children }: ChromeAuthProviderProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-provider">
        <div className="loading-container">
          <BrandedLoader size="large" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-provider">
        <ExtensionAuthPage />
      </div>
    )
  }

  return (
    <div className="auth-provider">
      {children}
    </div>
  )
}
