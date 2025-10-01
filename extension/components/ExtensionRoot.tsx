/**
 * Extension Root Component
 * Main entry point for Chrome extension
 */

import React from 'react'
import { ChromeAuthProvider } from './ChromeAuthProvider'
import { ExtensionDashboard } from './ExtensionDashboard'

// Import semantic CSS
import '../css/extension.css'
import '../css/auth.css'

export function ExtensionRoot() {
  return (
    <div className="extension-root">
      <ChromeAuthProvider>
        <ExtensionDashboard />
      </ChromeAuthProvider>
    </div>
  )
}
