'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function TooltipPage() {
  return (
    <div className="p-8 max-w-sm mx-auto flex justify-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
} 