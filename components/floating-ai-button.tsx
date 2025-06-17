'use client'

import React from 'react'
import { Button } from '@/components/ui/button' // Assuming a button component exists
import { Sparkles } from 'lucide-react'

export default function FloatingAIButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button size="lg" className="rounded-full shadow-lg">
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  )
} 