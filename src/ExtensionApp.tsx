import React, { Suspense } from 'react'
import { ExtensionDashboard } from './ExtensionDashboard'
import { ExtensionProviders } from './ExtensionProviders'

// Lightweight loading component
const LoadingSpinner = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
    zIndex: 9999
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
)

export const ExtensionApp: React.FC = () => {
  return (
    <ExtensionProviders>
      <Suspense fallback={<LoadingSpinner />}>
        <ExtensionDashboard />
      </Suspense>
    </ExtensionProviders>
  )
}