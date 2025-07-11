declare module 'motion/react' {
  import * as React from 'react'
  // Re-export any component as `any` to silence TS until proper types are available
  export const motion: any
  export const AnimatePresence: React.FC<{ children?: React.ReactNode }>
}