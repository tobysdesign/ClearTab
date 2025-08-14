'use client'

import { ExpandableCardContainer } from '@/components/ui/expandable-card-container'
import { Card as CardType } from '@/components/ui/expandable-card-context'

const demoCards: CardType[] = [
  {
    title: 'Demo Task',
    description: 'A short description',
    ctaText: 'Play',
    src: 'https://via.placeholder.com/100'
  },
  {
    title: 'Second Card',
    description: 'Another description',
    ctaText: 'Open',
    src: 'https://via.placeholder.com/100'
  }
]

export default function ExpandableCardStyleGuidePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">ExpandableCard</h1>
      <ExpandableCardContainer cards={demoCards} />
    </div>
  )
} 