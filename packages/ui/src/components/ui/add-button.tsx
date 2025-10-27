'use client'

import { Button, type ButtonProps } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'
import { AddIcon } from '../../../../../components/icons/add'

interface AddButtonProps extends ButtonProps {
  tooltip?: string
}

export function AddButton({ tooltip, children, ...props }: AddButtonProps) {
  const button = (
    <Button size="icon" variant="ghost-icon" {...props}>
      {children || <AddIcon size={16} />}
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