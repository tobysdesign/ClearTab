'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-grid-layout/css/styles.css'
import styles from './countdown-widget.module.css'
import { cn } from '@/lib/utils'

interface CountdownWidgetProps {
  title?: string
  totalDays: number
  remainingDays: number
  variant?: 'dots' | 'circles'
  size?: 'small' | 'medium' | 'large'
}

export function CountdownWidget({ 
  title = 'Payday',
  totalDays,
  remainingDays,
  variant = 'dots',
  size = 'medium'
}: CountdownWidgetProps) {
  const [daysLeft, setDaysLeft] = useState<number>(remainingDays)
  const dotsContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // Measure container size for dynamic dot sizing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const updateContainerSize = () => {
      if (dotsContainerRef.current) {
        const rect = dotsContainerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateContainerSize, 100)
    }
    
    // Initial measurement with a small delay to ensure DOM is ready
    const initialTimeout = setTimeout(updateContainerSize, 50)
    const resizeObserver = new ResizeObserver(debouncedUpdate)
    if (dotsContainerRef.current) {
      resizeObserver.observe(dotsContainerRef.current)
    }
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(initialTimeout)
      resizeObserver.disconnect()
    }
  }, [])
  
  // Format the days left for display
  const formattedDaysLeft = daysLeft.toString().padStart(2, '0')
  const [firstDigit, secondDigit] = formattedDaysLeft.split('')

  // Calculate optimal grid layout
  const calculateGridLayout = () => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { cols: 5, rows: Math.ceil(totalDays / 5), cellSize: 20 }
    }
    
    const padding = 16
    const gap = 3
    const availableWidth = containerSize.width - padding * 2
    const availableHeight = containerSize.height - padding * 2
    
    // Calculate optimal grid dimensions
    const aspectRatio = availableWidth / availableHeight
    const cols = Math.ceil(Math.sqrt(totalDays * aspectRatio))
    const rows = Math.ceil(totalDays / cols)
    
    // Calculate cell size to fit all dots
    const cellSize = Math.min(
      (availableWidth - (cols - 1) * gap) / cols,
      (availableHeight - (rows - 1) * gap) / rows
    )
    
    return { cols, rows, cellSize: Math.max(cellSize, 8) }
  }
  
  const { cols, rows, cellSize } = calculateGridLayout()
  
  // Generate grid items for react-grid-layout
  const generateGridItems = () => {
    const items = []
    for (let i = 0; i < totalDays; i++) {
      const isActive = i < daysLeft
      const row = Math.floor(i / cols)
      const col = i % cols
      
      items.push({
        i: i.toString(),
        x: col,
        y: row,
        w: 1,
        h: 1,
        isActive
      })
    }
    return items
  }
  
  const gridItems = generateGridItems()
  
  // Generate dot component
  const generateDot = (item: any) => {
    const isActive = item.isActive
    
    return (
      <motion.div
        key={item.i}
        className="w-full h-full flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: parseInt(item.i) * 0.01,
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <div 
          className="rounded-full"
          style={{
            width: isActive ? `${cellSize * 0.8}px` : `${cellSize * 0.5}px`,
            height: isActive ? `${cellSize * 0.8}px` : `${cellSize * 0.5}px`,
            backgroundColor: isActive ? '#FF69B4' : 'rgba(255, 255, 255, 0.2)',
            opacity: isActive ? 1 : 0.4,
          }}
        />
      </motion.div>
    )
  }
  
  return (
    <div className={styles.container}>
      <div className="relative flex flex-col h-full w-full p-4">
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6" />
        </div>
        
        {/* Header row */}
        <div className="flex flex-col gap-1 mb-3">
          <h2 className="font-inter-display text-[14px] font-normal text-white">Countdown</h2>
          <span className="font-inter-display text-[14px] font-normal text-[#8D8D8D]">{title}</span>
        </div>
        
        {/* Two-column layout */}
        <div className="flex flex-1 gap-4">
          {/* Left column - Dots */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div 
              ref={dotsContainerRef}
              className="flex-grow"
              style={{ minHeight: '120px' }}
            >
              <GridLayout
                className="layout"
                layout={gridItems}
                cols={cols}
                rowHeight={cellSize}
                width={containerSize.width || 200}
                margin={[3, 3]}
                containerPadding={[8, 8]}
                isDraggable={false}
                isResizable={false}
                useCSSTransforms={false}
                style={{ height: '100%' }}
              >
                {gridItems.map(item => (
                  <div key={item.i}>
                    {generateDot(item)}
                  </div>
                ))}
              </GridLayout>
            </div>
          </div>
          
          {/* Right column - Days text */}
          <div className="flex items-end justify-center">
            <div className="flex flex-col items-center">
              <div className="flex items-baseline">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`first-${daysLeft}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="font-inter-display text-[48px] font-thin leading-none text-white"
                    style={{ fontWeight: 100 }}
                  >
                    {firstDigit}
                  </motion.span>
                </AnimatePresence>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`second-${daysLeft}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
                    className="font-inter-display text-[48px] font-thin leading-none text-white"
                    style={{ fontWeight: 100 }}
                  >
                    {secondDigit}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="font-inter-display text-[18px] font-light leading-none text-white mt-1">Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 