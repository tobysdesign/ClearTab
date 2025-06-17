'use client'

import { PlusIcon } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AddButtonProps extends ButtonProps {
  tooltip?: string
}

export function AddButton({ tooltip, ...props }: AddButtonProps) {
  const button = (
    <Button size="icon" variant="ghost" {...props}>
      <PlusIcon className="h-4 w-4" />
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
} 