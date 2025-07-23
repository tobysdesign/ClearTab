'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { useMotionTemplate, useMotionValue, motion } from 'framer-motion'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    const radius = 100 // change this to increase the radius of the hover effect
    const [visible, setVisible] = React.useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
      const { currentTarget, clientX, clientY } = event
      const { left, top } = currentTarget.getBoundingClientRect()

      mouseX.set(clientX - left)
      mouseY.set(clientY - top)
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          var(--dark-pink, #333333),
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="p-[2px] rounded-lg transition duration-300 ease-out group/input"
      >
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  },
)
Input.displayName = 'Input'

export { Input } 