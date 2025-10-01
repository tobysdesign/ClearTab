/**
 * Extension Entry Point
 * Main React app for Chrome extension
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { ExtensionRoot } from './components/ExtensionRoot'

// Get root element
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

// Create React root and render app
const root = createRoot(container)
root.render(<ExtensionRoot />)
