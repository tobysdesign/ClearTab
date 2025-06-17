'use client'

import { Dock } from '@/components/ui/dock'
import { DockIcon } from '@/components/ui/dock-icon'
import { MessageCircle, Terminal, Trash } from 'lucide-react'

export default function DockPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Dock Component</h1>
      <p className="mb-16 text-muted-foreground text-center max-w-md mx-auto">
        The Dock provides a magnetic, MacOS-like dock effect. Icons scale based
        on the mouse's proximity. It is composed of a `Dock` container and
        `DockIcon` children.
      </p>
      <div className="flex justify-center">
        <Dock>
          <DockIcon>
            <MessageCircle className="h-6 w-6" />
          </DockIcon>
          <DockIcon>
            <Terminal className="h-6 w-6" />
          </DockIcon>
          <DockIcon>
            <Trash className="h-6 w-6" />
          </DockIcon>
        </Dock>
      </div>
    </div>
  )
} 