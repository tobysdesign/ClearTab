'use client'

import { Button, type ButtonProps } from './button'
import { AddIcon } from '@/components/icons'

interface AddButtonProps extends ButtonProps {
  tooltip?: string
}

export function AddButton({ tooltip, children, ...props }: AddButtonProps) {
  return (
    <Button size="icon" variant="ghost-icon" tooltipLabel={tooltip} {...props}>
      {children || <AddIcon size={16} />}
    </Button>
  )
}
