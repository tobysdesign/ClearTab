'use client'

import { Button } from '@/components/ui/button'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export default function ToastPage() {
  const { toast } = useToast()

  return (
    <div className="p-8 max-w-sm mx-auto flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold mb-4">Toast Component</h1>

      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM',
            action: (
              <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
            ),
          })
        }}
      >
        Show Toast with Action
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            variant: 'destructive',
          })
        }}
      >
        Show Destructive Toast
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Simple Toast',
            description: 'This is a basic notification.',
          })
        }}
      >
        Show Simple Toast
      </Button>
    </div>
  )
} 