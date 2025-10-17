'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function TextareaPage() {
  return (
    <div className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-8">Textarea Component</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Standard Textarea</h2>
          <Textarea placeholder="Type your message here." />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Textarea with Label</h2>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">
            Textarea with Button
          </h2>
          <div className="grid w-full gap-2">
            <Textarea placeholder="Type your message here." />
            <Button>Send message</Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Disabled Textarea</h2>
          <Textarea placeholder="This textarea is disabled." disabled />
        </div>
      </div>
    </div>
  )
} 