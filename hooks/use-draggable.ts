"use client";

import { useState } from 'react';
import { useAnimate, useDragControls } from 'framer-motion';

export function useDraggable() {
  const [scope, animate] = useAnimate();
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();

  const handleDragStart = () => {
    setIsDragging(true);
    document.body.classList.add('dragging');
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    setIsDragging(false);
    document.body.classList.remove('dragging');

    const dropZone = document.elementFromPoint(info.point.x, info.point.y);

    if (dropZone?.classList.contains('drop-zone')) {
      const dropZoneId = dropZone.id;
      console.log(`Dropped on: ${dropZoneId}`);
      // Handle drop logic here
    } else {
      await animate(scope.current, { x: 0, y: 0 }, { type: 'spring' });
    }
  };

  return { scope, dragControls, isDragging, onDragStart: handleDragStart, onDragEnd: handleDragEnd };
} 