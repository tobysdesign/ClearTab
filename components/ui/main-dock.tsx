'use client'

import { forwardRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { Search, Settings, MessageSquare } from 'lucide-react'

interface MainDockProps {
  onSearch?: (query: string) => void
  onSettingsClick?: () => void
  onAIClick?: () => void
  position: { x: number; y: number }
  orientation?: 'horizontal' | 'vertical'
  isDragging?: boolean
}

export const MainDock = forwardRef<HTMLDivElement, MainDockProps>(
  ({ onSearch, onSettingsClick, onAIClick, position, orientation = 'horizontal', isDragging }, ref) => {
    const [mounted, setMounted] = useState(false)
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: 'main-dock',
    })

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) return null

    const isVertical = orientation === 'vertical'
    const style: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition: isDragging ? 'none' : 'all 0.2s ease-out',
      touchAction: 'none',
      userSelect: 'none',
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 50,
      width: 'auto',
      display: 'flex'
    }

    return (
      <div
        ref={(node) => {
          setNodeRef(node)
          if (ref && typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'flex gap-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border shadow-lg',
          isVertical ? 'flex-col' : 'flex-row',
          isDragging && 'opacity-90'
        )}
      >
        <Input
          type="search"
          placeholder="Search..."
          className="w-48"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <Button variant="ghost-icon" size="icon" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost-icon" size="icon" onClick={onAIClick}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    )
  }
)

MainDock.displayName = 'MainDock' 