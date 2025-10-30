"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
// Import the actual login widgets
import { LoginNotesWidget } from "@/components/widgets/login-notes-widget";
import { LoginTasksWidget } from "@/components/widgets/login-tasks-widget";
import { LoginScheduleWidget } from "@/components/widgets/login-schedule-widget";
import { LoginWeatherWidget } from "@/components/widgets/login-weather-widget";
import { LoginRecorderWidget } from "@/components/widgets/login-recorder-widget";
import { LoginCountdownWidget } from "@/components/widgets/login-countdown-widget";

import { useDockPadding } from "@/hooks/use-dock-padding";
import styles from "./login-bento-grid.module.css";

interface LoginBentoGridProps {
  login: ReactNode;
  searchQuery: string;
  dockPosition: "top" | "left" | "right" | "bottom";
}

export function LoginBentoGrid({
  login,
  dockPosition,
  searchQuery: _searchQuery,
}: LoginBentoGridProps) {
  const padding = useDockPadding(dockPosition);

  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
    className: styles.panelMotion,
  });

  return (
    <motion.div
      animate={{
        paddingTop: padding.paddingTop,
        paddingRight: padding.paddingRight,
        paddingBottom: padding.paddingBottom,
        paddingLeft: padding.paddingLeft,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      }}
      className="bento-container"
    >
      <div className={styles.combinedContainer}>
        <PanelGroup
          key="login-layout"
          direction="horizontal"
          className="panel-group"
        >
          {/* Column 1: Notes and widgets */}
          <Panel defaultSize={35} minSize={20}>
            <PanelGroup direction="vertical" className="panel-group">
              {/* Top row: Notes */}
              <Panel defaultSize={60}>
                <motion.div {...motionProps(0.1)} className="panel-motion">
                  <LoginNotesWidget />
                </motion.div>
              </Panel>

              <PanelResizeHandle className={styles.resizeHandleVertical} />

              {/* Bottom row: Weather, Voicenotes, Countdown */}
              <Panel defaultSize={40}>
                <PanelGroup direction="horizontal" className="panel-group">
                  <Panel defaultSize={33}>
                    <motion.div {...motionProps(0.3)} className="panel-motion">
                      <LoginWeatherWidget />
                    </motion.div>
                  </Panel>
                  <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                  <Panel defaultSize={33}>
                    <motion.div {...motionProps(0.5)} className="panel-motion">
                      <LoginRecorderWidget />
                    </motion.div>
                  </Panel>
                  <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                  <Panel defaultSize={34}>
                    <motion.div {...motionProps(0.6)} className="panel-motion">
                      <LoginCountdownWidget />
                    </motion.div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandleHorizontal} />

          {/* Column 2: Login widget - roughly responsive */}
          <Panel defaultSize={22} minSize={22} maxSize={22}>
            <motion.div {...motionProps(0.4)} className="panel-motion">
              {login}
            </motion.div>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandleHorizontal} />

          {/* Column 3: Tasks and Schedule */}
          <Panel defaultSize={35} minSize={10}>
            <PanelGroup direction="vertical" className="panel-group">
              {/* Tasks */}
              <Panel defaultSize={50}>
                <motion.div {...motionProps(0.2)} className="panel-motion">
                  <LoginTasksWidget />
                </motion.div>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandleVertical} />
              {/* Schedule */}
              <Panel defaultSize={50}>
                <motion.div {...motionProps(0.7)} className="panel-motion">
                  <LoginScheduleWidget />
                </motion.div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </motion.div>
  );
}
