'use client'

import { useEffect, useState } from "react"
import styles from './animated-toby-logo.module.css'
import { cn } from "@/lib/utils"

interface AnimatedTobyLogoProps {
  color?: string
  mode?: "binary" | "brand"
}

export function AnimatedTobyLogo({ 
  color = "#ffffff", 
  mode = "brand" 
}: AnimatedTobyLogoProps) {
  const [currentMode, setCurrentMode] = useState(mode)

  useEffect(() => {
    setCurrentMode(mode)
  }, [mode])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 419 162"
      style={{ width: "100%", height: "auto" }}
      className={styles.logo}
    >
      {/* Left bar → 1 or T stem */}
      <rect
        x={currentMode === "brand" ? 34 : 10}
        y={1}
        width="15"
        height="126"
        rx="7.5"
        fill={color}
        className={cn(styles.element, styles.tStem)}
        style={{
          '--x-pos': currentMode === "brand" ? '34px' : '10px'
        } as React.CSSProperties}
      />

      {/* T crossbar only visible in brand mode */}
      <rect
        x={0}
        y={72}
        width="15"
        height="83"
        rx="7.5"
        transform="rotate(-90 0 72)"
        fill={color}
        className={cn(styles.element, styles.tCrossbar, {
          [styles.visible]: currentMode === "brand",
          [styles.hidden]: currentMode !== "brand"
        })}
      />

      {/* 0 stays as is, shifts left */}
      <path
        d="M99 50.192C99 34.5973 102.727 22.5 110.18 13.9C117.633 5.3 125.011 1 138.312 1C151.613 1 161.991 5.3 169.444 13.9C176.897 22.5 180.624 34.5973 180.624 50.192V77.024C180.624 93.0773 176.897 105.289 169.444 113.66C161.991 122.031 154.613 126.216 141.312 126.216C128.011 126.216 117.633 122.031 110.18 113.66C102.727 105.289 99 93.0773 99 77.024V50.192Z"
        fill={color}
        className={cn(styles.element, styles.zero)}
        style={{
          '--x-pos': currentMode === "brand" ? '0px' : '-60px'
        } as React.CSSProperties}
      />

      {/* 0 dot morphs to . in brand mode */}
      <path
        d="M127.304 63.608C127.304 60.6267 128.393 58.0467 130.572 55.868C132.751 53.6893 135.331 52.6 138.312 52.6C141.293 52.6 143.873 53.6893 146.052 55.868C148.231 58.0467 149.32 60.6267 149.32 63.608C149.32 66.5893 148.231 69.1693 146.052 71.348C143.873 73.5267 141.293 74.616 138.312 74.616C135.331 74.616 132.751 73.5267 130.572 71.348C128.393 69.1693 127.304 66.5893 127.304 63.608Z"
        fill={color}
        className={cn(styles.element, styles.dot)}
        style={{
          '--scale': currentMode === "brand" ? '0.6' : '1',
          '--x-pos': currentMode === "brand" ? '80px' : '0px'
        } as React.CSSProperties}
      />

      {/* b circle appears in brand mode */}
      <path
        d="M200.268 108.268C198.089 110.447 197 113.027 197 116.008C197 118.989 198.089 121.569 200.268 123.748C202.447 125.927 205.027 127.016 208.008 127.016C210.989 127.016 213.569 125.927 215.748 123.748C217.927 121.569 219.016 118.989 219.016 116.008C219.016 113.027 217.927 110.447 215.748 108.268C213.569 106.089 210.989 105 208.008 105C205.027 105 202.447 106.089 200.268 108.268Z"
        fill={color}
        className={cn(styles.element, styles.bCircle, {
          [styles.visible]: currentMode === "brand",
          [styles.hidden]: currentMode !== "brand"
        })}
      />

      {/* b stem slides in only in brand */}
      <rect
        x="235"
        width="15"
        height="125"
        rx="7.5"
        fill={color}
        className={cn(styles.element, styles.bStem, {
          [styles.visible]: currentMode === "brand",
          [styles.hidden]: currentMode !== "brand"
        })}
      />

      {/* y arm right */}
      <rect
        x="407.598"
        y="23"
        width="15"
        height="151.184"
        rx="7.5"
        transform="rotate(27.1555 407.598 23)"
        fill={color}
        className={cn(styles.element, styles.yArmRight, {
          [styles.visible]: currentMode === "brand",
          [styles.hidden]: currentMode !== "brand"
        })}
      />

      {/* y arm left */}
      <rect
        width="15"
        height="87.6502"
        rx="7.5"
        transform="matrix(-0.889771 0.456407 0.456407 0.889771 347.347 23)"
        fill={color}
        className={cn(styles.element, styles.yArmLeft, {
          [styles.visible]: currentMode === "brand",
          [styles.hidden]: currentMode !== "brand"
        })}
      />
    </svg>
  )
} 