"use client"

// Icons replaced with ASCII placeholders
import { CheckIcon } from '@/components/icons'
import { useAction } from 'next-safe-action/hooks'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveApiKey } from '@/lib/actions/extension-stubs'
import { useToast } from '@/components/ui/use-toast'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './api-settings.module.css'

export function APISettings(): ReactNode {
  const { toast } = useToast()
  const { execute, result: _result, status } = useAction(saveApiKey)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [_isLoading, _setIsLoading] = useState(true)

  // Check if user has API key on load
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/settings/check-api-key')
        const data = await response.json() as { hasApiKey: boolean }
        setHasApiKey(data.hasApiKey)
      } catch (error) {
        console.error('Error checking API key:', error)
        toast({
          title: 'Error',
          description: 'Failed to check API key status',
          variant: 'destructive',
        })
      } finally {
        _setIsLoading(false)
      }
    }
    checkApiKey()
  }, [toast])

  const handleSaveApiKey = async () => {
    if (!apiKey) return

    try {
      await execute({ apiKey })
      setHasApiKey(true)
      setShowApiKeyInput(false)
      setApiKey('')
      toast({
        title: 'Success',
        description: 'API key saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save API key',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.sectionTitle}>Free Tier</div>
        <div className={styles.sectionDescription}>Basic features with limited usage</div>

        <ul className={styles.featureList}>
          <li>Basic AI assistance</li>
          <li>Limited API calls</li>
          <li>Standard response time</li>
        </ul>
      </div>

      <div className={styles.formSection}>
        <div className={styles.tierHeader}>
          <div className={styles.sectionTitle}>Pro Tier</div>
          <span className={styles.starIcon}>★</span>
        </div>
        <div className={styles.sectionDescription}>Enhanced features with your own API key</div>

        <ul className={styles.featureList}>
          <li>Advanced AI capabilities</li>
          <li>Unlimited API calls</li>
          <li>Priority response time</li>
          <li>Custom model selection</li>
        </ul>

        {hasApiKey ? (
          <div className={styles.successRow}>
            <CheckIcon size={16} className={styles.successIcon} />
            <span>API key configured</span>
          </div>
        ) : showApiKeyInput ? (
          <div className={styles.apiKeyForm}>
            <div className={styles.formRow}>
              <Label htmlFor="apiKey" className={styles.formLabel}>OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className={styles.formInput}
              />
            </div>
            <div className={styles.buttonRow}>
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey || status === 'executing'}
                className={styles.saveButton}
              >
                {status === 'executing' ? 'Saving...' : 'Save API Key'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApiKeyInput(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowApiKeyInput(true)} className={styles.addButton}>
            Add API Key
          </Button>
        )}
      </div>
    </div>
  )
} 