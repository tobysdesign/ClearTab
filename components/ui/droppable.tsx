'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableProps {
    id: string
    className?: string
}

export function Droppable({ id, className }: DroppableProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    })

    return (
        <div
            ref={setNodeRef}
            data-droppable={isOver}
            className={cn(className)}
        />
    )
} 