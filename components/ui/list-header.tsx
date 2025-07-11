'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './list-header.module.css'
import { CardTitle } from '@/components/ui/card'

interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  children?: React.ReactNode
}

const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div
        className={cn(styles.root, className)}
        ref={ref}
        {...props}
      >
        <CardTitle>{title}</CardTitle>
        <div className={styles.actions}>{children}</div>
      </div>
    )
  },
)
ListHeader.displayName = 'ListHeader'

export { ListHeader } 