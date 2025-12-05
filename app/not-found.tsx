import Link from 'next/link'
import { Button } from '@cleartab/ui'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Not Found</h2>
        <p className={styles.message}>
          Could not find the requested resource
        </p>
        <div className={styles.buttonContainer}>
          <Button asChild tooltipLabel="Go home" shortcut="⌘H">
            <Link href="/">
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 
