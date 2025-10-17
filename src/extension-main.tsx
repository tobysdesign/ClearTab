import React from 'react'
import { createRoot } from 'react-dom/client'
import { ExtensionApp } from './ExtensionApp'

// Extension-specific CSS
import './extension.css'

// Performance monitoring
const startTime = performance.now()

// Create React app
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found')
}

const root = createRoot(container)

// Extension-specific error boundary
class ExtensionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Extension: React error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#8d8d8d',
          backgroundColor: '#1a1a1a',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h2>Something went wrong</h2>
          <p>Please reload the extension</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Render the app
root.render(
  <ExtensionErrorBoundary>
    <ExtensionApp />
  </ExtensionErrorBoundary>
)

// Performance logging
const endTime = performance.now()
console.log(`Extension React app rendered in ${endTime - startTime}ms`)

// Notify that app is ready
window.dispatchEvent(new CustomEvent('appReady'))