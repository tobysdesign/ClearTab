'use client'

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { WeatherWidgetAlt } from '@/components/widgets/weather-widget-alt'
import { ScheduleWidget } from '@/components/widgets/schedule-widget'
import { FinanceWidget } from '@/components/widgets/finance-widget'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { Globe } from '@/components/ui/globe'
import { useDockPadding } from '@/hooks/use-dock-padding'
import Image from 'next/image'

const WidgetSkeleton = () => (
  <Card className="h-full w-full flex items-center justify-center">
    <div className="relative w-[90px] h-[50px]">
      <Image
        src="/assets/loading.gif"
        alt="Loading..."
        fill
        className="object-contain"
        priority
      />
    </div>
  </Card>
)

interface ResizableBentoGridProps {
    notes: ReactNode
    tasks: ReactNode
    searchQuery: string
    dockPosition: 'top' | 'left' | 'right' | 'bottom'
}

export function ResizableBentoGrid({
  notes,
  tasks,
  dockPosition,
}: ResizableBentoGridProps) {
  const padding = useDockPadding(dockPosition)
  
  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
    className: 'h-full w-full',
  })

  return (
    <motion.div
      animate={{
        paddingTop: padding.paddingTop,
        paddingRight: padding.paddingRight,
        paddingBottom: padding.paddingBottom,
        paddingLeft: padding.paddingLeft,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      }}
      className="h-full w-full"
    >
      <PanelGroup direction="horizontal" className="h-full w-full">
      <Panel defaultSize={67} minSize={30}>
        <PanelGroup direction="vertical" className="h-full w-full">
          <Panel defaultSize={60} minSize={25}>
            <motion.div {...motionProps(0.25)}>{notes}</motion.div>
          </Panel>
          <PanelResizeHandle className="my-2 h-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
          <Panel defaultSize={40} minSize={25}>
            <PanelGroup direction="horizontal" className="h-full w-full">
              <Panel>
                <motion.div {...motionProps(0.75)}>
                  <WeatherWidgetAlt />
                </motion.div>
              </Panel>
              <PanelResizeHandle className="mx-2 w-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
              {/* <BentoGridItem id="finance" className="col-span-1 min-h-[200px]">
                <FinanceWidget />
              </BentoGridItem> */}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className="mx-2 w-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
      <Panel defaultSize={33} minSize={20}>
        <PanelGroup direction="vertical" className="h-full w-full">
          <Panel defaultSize={50} minSize={25}>
            <motion.div {...motionProps(0.5)}>{tasks}</motion.div>
          </Panel>
          <PanelResizeHandle className="my-2 h-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
          <Panel defaultSize={50} minSize={25}>
            <motion.div {...motionProps(1.25)}>
              <ScheduleWidget />
            </motion.div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
    </motion.div>
  )
} 