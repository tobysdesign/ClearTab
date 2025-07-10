'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useChatContext } from '@/hooks/use-chat-context'

import styles from './floating-ai-button.module.css'

export default function FloatingAIButton() {
  const { openChat } = useChatContext()

  return (
    <div className={styles.floatingButton}>
      <Button size="lg" className={styles.floatingButtonBtn} onClick={openChat}>
        <Sparkles className={styles.icon} />
      </Button>
    </div>
  )
} 