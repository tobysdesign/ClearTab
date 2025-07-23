'use client'

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion } from 'framer-motion'
import { CountdownWidget } from '@/components/widgets/countdown-widget'

export default function TestCountdownBentoPage() {
  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
    className: 'h-full w-full',
  })

  return (
    <div className="min-h-screen bg-black p-4">
      <h1 className="text-white text-2xl mb-4">Countdown Widgets in Bento Grid</h1>
      
      <div className="h-[calc(100vh-100px)] w-full">
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel defaultSize={67} minSize={30}>
            <PanelGroup direction="vertical" className="h-full w-full">
              <Panel defaultSize={60} minSize={25}>
                <motion.div {...motionProps(0.25)}>
                  <CountdownWidget 
                    title="Big Project Launch" 
                    totalDays={100}
                    remainingDays={85}
                    variant="dots"
                    size="large"
                  />
                </motion.div>
              </Panel>
              <PanelResizeHandle className="my-2 h-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
              <Panel defaultSize={40} minSize={25}>
                <PanelGroup direction="horizontal" className="h-full w-full">
                  <Panel>
                    <motion.div {...motionProps(0.75)}>
                      <CountdownWidget 
                        title="Weekend Trip" 
                        totalDays={14}
                        remainingDays={10}
                        variant="dots"
                        size="medium"
                      />
                    </motion.div>
                  </Panel>
                  <PanelResizeHandle className="mx-2 w-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
                  <Panel>
                    <motion.div {...motionProps(1.0)}>
                      <CountdownWidget 
                        title="Payday" 
                        totalDays={30}
                        remainingDays={28}
                        variant="circles"
                        size="medium"
                      />
                    </motion.div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="mx-2 w-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
          <Panel defaultSize={33} minSize={20}>
            <PanelGroup direction="vertical" className="h-full w-full">
              <Panel defaultSize={50} minSize={25}>
                <motion.div {...motionProps(0.5)}>
                  <CountdownWidget 
                    title="Vacation" 
                    totalDays={60}
                    remainingDays={45}
                    variant="dots"
                    size="medium"
                  />
                </motion.div>
              </Panel>
              <PanelResizeHandle className="my-2 h-px bg-border transition-colors duration-300 hover:bg-[#FF4F4F]" />
              <Panel defaultSize={50} minSize={25}>
                <motion.div {...motionProps(1.25)}>
                  <CountdownWidget 
                    title="Conference" 
                    totalDays={7}
                    remainingDays={3}
                    variant="circles"
                    size="small"
                  />
                </motion.div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}