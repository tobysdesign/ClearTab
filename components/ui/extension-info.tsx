'use client'

import { useEffect, useState } from 'react'
import { getEnvironmentConfig, getExtensionId, isExtension } from '@/lib/chrome-extension-utils'

interface ExtensionInfo {
  isExtension: boolean
  extensionId: string | null
  baseUrl: string
  storageType: string
}

export function ExtensionInfo() {
  const [info, setInfo] = useState<ExtensionInfo | null>(null)

  useEffect(() => {
    const config = getEnvironmentConfig()
    setInfo({
      isExtension: config.isExtension,
      extensionId: config.extensionId,
      baseUrl: config.baseUrl,
      storageType: config.storageType
    })
  }, [])

  if (!info) return null

  return (
    <div className="text-xs text-white/40 p-2 bg-white/40 rounded">
      <div>Environment: {info.isExtension ? 'Chrome Extension' : 'Web App'}</div>
      {info.extensionId && <div>Extension ID: {info.extensionId}</div>}
      <div>Storage: {info.storageType}</div>
    </div>
  )
}

// Hook to get extension info in components
export function useExtensionInfo() {
  const [info, setInfo] = useState<ExtensionInfo | null>(null)

  useEffect(() => {
    const config = getEnvironmentConfig()
    setInfo({
      isExtension: config.isExtension,
      extensionId: config.extensionId,
      baseUrl: config.baseUrl,
      storageType: config.storageType
    })
  }, [])

  return info
}