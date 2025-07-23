'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'
import { EmptyState } from '@/components/ui/empty-state'
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

interface WeatherData {
  temperature: number;
  description: string;
  high: number;
  low: number;
  humidity: number;
  rainChance: number;
  location: string;
  main: string;
  windSpeed?: number;
}

interface WeatherWidgetProps {
  city?: string
  className?: string
}

interface TimeSlot {
  id: string;
  label: string;
  temperature: number;
  condition: string;
  time: string;
}

function getTimeSlot(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'day'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

function TimeSlotCard({ 
  slot, 
  high, 
  low, 
  location,
  isExpanded
}: { 
  slot: TimeSlot;
  high: number;
  low: number;
  location: string;
  isExpanded: boolean;
}) {
  const { data: weather } = useQuery<WeatherData>({
    queryKey: ['weather', location],
    queryFn: () => fetch(`/api/weather?location=${encodeURIComponent(location)}`).then(res => res.json()),
    enabled: !!location,
  });
  const { main: condition } = weather || { main: 'Clear' }
  const IconComponent = null;

  // Smoother transition settings
  const smoothTransition = useMemo(() => ({
    type: "spring" as const,
    stiffness: 120,  // Reduced from 400
    damping: 25,     // Adjusted from 30
    mass: 1,         // Added mass for smoother feel
    restDelta: 0.01  // Fine-tuned rest threshold
  }), [])

  return (
    <motion.div
      className={cn(
        "relative h-full rounded-2xl cursor-pointer overflow-hidden p-0",
        "border border-[#3C3C3C] bg-gradient-to-b from-[#2C2C2C] to-[#1C1C1C]",
        isExpanded ? "bg-[#1C1C1C]" : "bg-[#2C2C2C]"
      )}
      initial={false}
      animate={{ 
        flexGrow: isExpanded ? 5 : 1
      }}
      transition={smoothTransition}
      style={{
        zIndex: isExpanded ? 10 : 1
      }}
    >
      <div className="relative h-full w-full p-0">
        {/* Weather animation - always visible */}
        {IconComponent && <IconComponent isExpanded={isExpanded} timeSlot={slot.id} />}
        
        <div className="absolute top-[24px] left-[24px] flex flex-col gap-0.5 z-10">
          <AnimatePresence>
            <motion.div
              key="location"
              initial={false}
              animate={{
                opacity: isExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-[#FF7A33] text-sm font-medium"
            >
              {location}
            </motion.div>

            <motion.div
              key="label"
              initial={false}
              animate={{
                rotate: isExpanded ? 0 : 90,
                y: isExpanded ? 0 : -20,
              }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
                mass: 0.8
              }}
              className="text-[#8C8C8C] text-sm origin-bottom-left"
            >
              {slot.label}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 1 : 0,
            scale: isExpanded ? 1 : 0.8,
            x: isExpanded ? 12 : 0,
            y: isExpanded ? 48 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute z-10"
        >
          <div className="flex items-baseline mt-4  ">
            <span className="font-tiny font-light italic text-white text-[40px] sm:text-[55px] md:text-[70px] leading-none">
              {slot.temperature}
            </span>
            <span className="text-white text-lg sm:text-xl md:text-2xl">℃</span>
          </div>

          <div className="mt-4">
            <p className="text-white text-lg sm:text-xl md:text-2xl">{slot.condition}</p>
            <div className="flex gap-4 sm:gap-5 md:gap-6 text-base sm:text-lg md:text-xl">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[#8C8C8C]">H:</span>
                <span className="text-[#8C8C8C] font-tiny font-light italic">{high}℃</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[#8C8C8C]">L:</span>
                <span className="text-[#8C8C8C] font-tiny font-light italic">{low}℃</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 0 : 1
          }}
          style={{
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)"
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute font-tiny font-light italic text-white text-xl sm:text-2xl md:text-[30px] leading-none z-10"
        >
          {slot.temperature}
        </motion.div>
      </div>
    </motion.div>
  )
}

function WeatherTimeline({ weather, className }: { weather: WeatherData; className?: string }) {
  const currentHour = new Date().getHours()
  const currentTimeSlot = getTimeSlot(currentHour)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(currentTimeSlot)
  const [isInteracting, setIsInteracting] = useState(false)
  const interactionTimeout = useRef<NodeJS.Timeout | null>(null)

  const timeSlots: TimeSlot[] = useMemo(() => [
    { id: 'morning', label: 'Morning', temperature: weather.temperature, condition: weather.main, time: '09:00' },
    { id: 'day', label: 'Day', temperature: weather.high, condition: 'Clear', time: '14:00' },
    { id: 'evening', label: 'Evening', temperature: weather.temperature - 2, condition: 'Clouds', time: '20:00' },
    { id: 'night', label: 'Night', temperature: weather.low, condition: 'Clear', time: '01:00' },
  ], [weather.temperature, weather.high, weather.low, weather.main])

  const handleMouseEnter = useCallback((slotId: string) => {
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
    setIsInteracting(true)
    setExpandedSlot(slotId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    interactionTimeout.current = setTimeout(() => {
      setIsInteracting(false)
      setExpandedSlot(currentTimeSlot)
    }, 300)
  }, [currentTimeSlot])
  
  const handleTouchStart = useCallback((slotId: string) => {
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current)
    setIsInteracting(true)
    if (expandedSlot === slotId) {
      setExpandedSlot(null)
    } else {
      setExpandedSlot(slotId)
  }
  }, [expandedSlot])

  const handleTouchEnd = useCallback(() => {
    interactionTimeout.current = setTimeout(() => {
      setIsInteracting(false)
      setExpandedSlot(currentTimeSlot)
    }, 2000)
  }, [currentTimeSlot])

  // Smooth transition settings for container
  const containerTransition = useMemo(() => ({
    type: 'spring' as const,
    stiffness: 120,  // Reduced from 400
    damping: 25,     // Adjusted for smoother motion
    mass: 1,         // Added mass
    restDelta: 0.01  // Fine-tuned rest threshold
  }), [])

  return (
    <div 
      className={cn("flex items-stretch w-full h-full gap-2", className)}
      onMouseLeave={handleMouseLeave}
    >
      {timeSlots.map(slot => (
        <motion.div
          key={slot.id}
          className="h-full"
          onMouseEnter={() => handleMouseEnter(slot.id)}
          onTouchStart={() => handleTouchStart(slot.id)}
          onTouchEnd={handleTouchEnd}
          animate={{ flexGrow: expandedSlot === slot.id ? 5 : 1 }}
          transition={containerTransition}
        >
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            high={weather.high}
            low={weather.low}
            location={weather.location}
            isExpanded={expandedSlot === slot.id}
          />
        </motion.div>
      ))}
    </div>
  )
}

export function WeatherWidgetAlt({ className }: { className?: string }) {
  const queryClient = useQueryClient()

  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['weather', 'Sydney'], // Assuming a default for now
    queryFn: async () => {
      // Using the main weather API route, no city needed if it handles IP-based location
      const response = await fetch('/api/weather')
      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }
      const result = await response.json()
      return result.data
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['weather', 'Sydney'] })
  }, [queryClient])

  if (isLoading) {
    return <WidgetLoader className={cn("h-full", className)} />
  }

  if (error) {
    return (
      <Card className="dashCard min-h-[16rem] flex items-center justify-center">
        <EmptyState
          renderIcon={() => <CloudOff className="h-6 w-6 text-gray-400" />}
          title="Weather unavailable"
          description="Unable to load weather data. Check your connection and try again."
          action={{
            label: "Retry",
            onClick: handleRetry
          }}
          className="py-8"
        />
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  return <WeatherTimeline weather={weather} className={cn("h-full", className)} />
} 