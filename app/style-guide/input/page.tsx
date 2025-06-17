'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function InputPage() {
  return (
    <div className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-8">Input Component</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Standard Input</h2>
          <Input id="name" placeholder="Your Name" />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Input with Label</h2>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Disabled Input</h2>
          <Input id="disabled-input" placeholder="Disabled" disabled />
        </div>
      </div>
    </div>
  )
} 