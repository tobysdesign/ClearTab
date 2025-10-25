import * as React from 'react'

interface VisuallyHiddenProps {
  children: React.ReactNode
  asChild?: boolean
}

export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ children, asChild = false, ...props }, ref) => {
  const _Comp = asChild ? React.Fragment : 'span'
  
  if (asChild) {
    return <>{children}</>
  }
  
  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
      {...props}
    >
      {children}
    </span>
  )
})
VisuallyHidden.displayName = 'VisuallyHidden'