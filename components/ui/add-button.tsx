'use client'

import { PlusIcon } from 'lucide-react'
import styles from './add-button.module.css'
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
    <Button size="icon" variant="ghost-icon" {...props}>
      <PlusIcon className={styles.icon} />
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