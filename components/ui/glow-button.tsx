'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div className="glow-button-wrap">
      <button
        ref={ref}
          className={cn("glow-button-glassmorphic", className)}
        {...props}
      >
          <span>{children}</span>
      </button>
        <div className="glow-button-shadow"></div>
      </div>
    )
  }
)

GlowButton.displayName = "GlowButton"

export { GlowButton } 