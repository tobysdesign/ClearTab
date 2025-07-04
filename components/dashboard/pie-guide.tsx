'use client'

import { cn } from '@/lib/utils'

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeDonutSlice(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle)
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle)
  const startInner = polarToCartesian(x, y, innerRadius, endAngle)
  const endInner = polarToCartesian(x, y, innerRadius, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  const d = [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ')

  return d
}

function PieSlice({ size, innerRadius, outerRadius, startAngle, endAngle, isHovered }: PieSliceProps) {
  const pathData = describeDonutSlice(size / 2, size / 2, innerRadius, outerRadius, startAngle, endAngle)
  return (
    <path
      d={pathData}
      className={cn(
        'transition-all duration-200',
        isHovered ? 'fill-emerald-500/30 stroke-emerald-500' : 'fill-muted/20 stroke-muted',
      )}
      strokeWidth="2"
    />
  )
}

interface PieSliceProps {
    size: number
    innerRadius: number
    outerRadius: number
    startAngle: number
    endAngle: number
    isHovered: boolean
  }

interface PieGuideProps {
    isDragging: boolean;
    hoveredSlice: 'top' | 'left' | 'right' | 'bottom' | null;
    position: { x: number; y: number } | null;
    originPosition: 'top' | 'left' | 'right' | 'bottom';
}

export function PieGuide({ isDragging, hoveredSlice, position, originPosition }: PieGuideProps) {
    if (!isDragging || !position) return null

    const size = 200
    const innerRadius = 60
    const outerRadius = 90

    const sliceDefinitions = {
        top: { startAngle: 225, endAngle: 315 },
        right: { startAngle: -45, endAngle: 45 },
        bottom: { startAngle: 45, endAngle: 135 },
        left: { startAngle: 135, endAngle: 225 },
    };
    
    const validMoves = (Object.keys(sliceDefinitions) as ('top' | 'left' | 'right' | 'bottom')[])
        .filter(p => p !== originPosition);

    return (
        <div 
            className="pointer-events-none fixed top-0 left-0 z-40"
            style={{
                transform: `translate(${position.x - size / 2}px, ${position.y - size / 2}px)`
            }}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g transform={`rotate(90 ${size/2} ${size/2})`}>
                    {validMoves.map((key) => {
                         const def = sliceDefinitions[key];
                         return (
                            <PieSlice
                                key={key}
                                size={size}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                startAngle={def.startAngle}
                                endAngle={def.endAngle}
                                isHovered={hoveredSlice === key}
                            />
                         )
                    })}
                </g>
            </svg>
        </div>
    )
} 