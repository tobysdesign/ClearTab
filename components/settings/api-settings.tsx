"use client"

// Icons replaced with ASCII placeholders
import { useAction } from 'next-safe-action/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveApiKey } from '@/lib/actions/settings'
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
        setIsLoading(false)
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
    <div className={styles.gridGap6}>
      <Card>
        <CardHeader>
          <CardTitle>Free Tier</CardTitle>
          <CardDescription>Basic features with limited usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={styles.listDisc}>
            <li>Basic AI assistance</li>
            <li>Limited API calls</li>
            <li>Standard response time</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className={styles.flexItemsGap2}>
            <CardTitle>Pro Tier</CardTitle>
            <span className={styles.starIcon}>★</span>
          </div>
          <CardDescription>Enhanced features with your own API key</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={styles.listDiscMb6}>
            <li>Advanced AI capabilities</li>
            <li>Unlimited API calls</li>
            <li>Priority response time</li>
            <li>Custom model selection</li>
          </ul>

          {hasApiKey ? (
            <div className={styles.successText}>
              <span className={styles.checkIcon}>✓</span>
              <span>API key configured</span>
            </div>
          ) : showApiKeyInput ? (
            <div className={styles.spaceY4}>
              <div className={styles.spaceY2}>
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className={styles.flexGap2}>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey || status === 'executing'}
                >
                  {status === 'executing' ? 'Saving...' : 'Save API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApiKeyInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowApiKeyInput(true)}>
              Add API Key
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 