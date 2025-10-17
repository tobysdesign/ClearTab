'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import styles from './error.module.css'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Something went wrong!</h2>
        <p className={styles.description}>
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className={styles.buttonGroup}>
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
} 