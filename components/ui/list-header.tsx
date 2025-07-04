'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { CardTitle } from '@/components/ui/card'

interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  children?: React.ReactNode
}

const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-between p-4',
          className,
        )}
        ref={ref}
        {...props}
      >
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    )
  },
)
ListHeader.displayName = 'ListHeader'

export { ListHeader } 