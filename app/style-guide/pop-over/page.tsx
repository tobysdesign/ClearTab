'use client'

import { Button } from '@/components/ui/button'
import {
  PopOver,
  PopOverClose,
  PopOverContent,
  PopOverTrigger,
} from '@/components/ui/pop-over'

export default function PopOverPage() {
  return (
    <div className="p-8 max-w-sm mx-auto flex justify-center">
      <PopOver>
        <PopOverTrigger asChild>
          <Button variant="outline">Open Pop-Over</Button>
        </PopOverTrigger>
        <PopOverContent>
          <div className="mx-auto w-full max-w-sm p-4">
            <h2 className="text-lg font-bold">Pop-Over</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This is a custom pop-over component. It opens without a background
              overlay.
            </p>
            <PopOverClose asChild>
              <Button variant="outline" className="mt-4 w-full">
                Close
              </Button>
            </PopOverClose>
          </div>
        </PopOverContent>
      </PopOver>
    </div>
  )
} 