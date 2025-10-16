'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import styles from './conversation-starters.module.css'

const allStarters = [
  "What's the single most important thing you want to move forward today?",
  'Do you want help structuring your tasks for today around your calendar?',
  'Would you like me to surface anything overdue or neglected before you plan?',
  'Want me to rewrite any rough notes into clean, actionable tasks?',
  "Your backlog's getting noisy — want help grouping or archiving low-value items?",
  "Is anything on your list that you know you won't actually do? I can help cull it.",
  'Do you want to frame any of these tasks in terms of outcomes rather than actions?',
  'Would you prefer a weekly review right now or a clean slate for the next block of time?',
  "What's on your mind that isn't showing up on your list yet?",
  'Is your current plan realistic for your energy and time today?',
  "I see your next meeting's in 45 minutes — want me to suggest a focus task you can knock out first?",
]

interface ConversationStartersProps {
  onSelect: (starter: string) => void
}

export function ConversationStarters({ onSelect }: ConversationStartersProps) {
  const [starters, setStarters] = useState<string[]>([])

  useEffect(() => {
    // Shuffle the array and pick the first two
    const shuffled = [...allStarters].sort(() => 0.5 - Math.random())
    setStarters(shuffled.slice(0, 2))
  }, [])

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Conversation starters</h3>
      <div className={styles.startersContainer}>
        {starters.map((starter, index) => (
          <motion.button
            key={starter}
            onClick={() => onSelect(starter)}
            className={styles.starterButton}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className={styles.starterText}>{starter}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
} 