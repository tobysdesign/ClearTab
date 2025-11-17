'use client'

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import styles from './checkbox.module.css'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(props.checked || props.defaultChecked || false)

  React.useEffect(() => {
    if (props.checked !== undefined) {
      setIsChecked(props.checked)
    }
  }, [props.checked])

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(styles.root, className)}
      {...props}
      onCheckedChange={(checked) => {
        setIsChecked(checked as boolean)
        props.onCheckedChange?.(checked)
      }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isChecked ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className={styles.checkboxMotion}
      >
        <CheckboxPrimitive.Indicator
          className={styles.indicator}
          forceMount
        >
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={false}
            animate={{
              opacity: isChecked ? 1 : 0,
              scale: isChecked ? 1 : 0.8,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <motion.path
              d="M3 8L6.5 11.5L13 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{
                pathLength: isChecked ? 1 : 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            />
          </motion.svg>
        </CheckboxPrimitive.Indicator>
      </motion.div>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
