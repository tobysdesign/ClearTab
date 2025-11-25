"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import React from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";

// Lazy-load the login widgets to reduce initial bundle size
const LoginNotesWidget = dynamic(
  () =>
    import("@/components/widgets/login-notes-widget").then((mod) => ({
      default: mod.LoginNotesWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

const LoginTasksWidget = dynamic(
  () =>
    import("@/components/widgets/login-tasks-widget").then((mod) => ({
      default: mod.LoginTasksWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

const LoginScheduleWidget = dynamic(
  () =>
    import("@/components/widgets/login-schedule-widget").then((mod) => ({
      default: mod.LoginScheduleWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

const LoginWeatherWidget = dynamic(
  () =>
    import("@/components/widgets/login-weather-widget").then((mod) => ({
      default: mod.LoginWeatherWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

const LoginRecorderWidget = dynamic(
  () =>
    import("@/components/widgets/login-recorder-widget").then((mod) => ({
      default: mod.LoginRecorderWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

const LoginCountdownWidget = dynamic(
  () =>
    import("@/components/widgets/login-countdown-widget").then((mod) => ({
      default: mod.LoginCountdownWidget,
    })),
  {
    ssr: false,
    loading: () => <div className="widget-loading">Loading...</div>,
  },
);

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

  const fadeStyle = (delay: number) => ({
    animationName: 'fadeIn',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
    animationDelay: `${delay}s`,
  } as React.CSSProperties);

  return (
    <div
      className="bento-container"
      style={{
        paddingTop: padding.paddingTop,
        paddingRight: padding.paddingRight,
        paddingBottom: padding.paddingBottom,
        paddingLeft: padding.paddingLeft,
        transition: 'padding 300ms ease-out',
      }}
    >
      <div className={styles.combinedContainer}>
        <PanelGroup
          key="login-layout"
          direction="horizontal"
          className="panel-group"
        >
          {/* Column 1: Notes and widgets */}
          <Panel defaultSize={45} minSize={20}>
            <PanelGroup direction="vertical" className="panel-group">
              {/* Top row: Notes */}
              <Panel defaultSize={60}>
                  <div className="panel-motion" style={fadeStyle(0.1)}>
                    <LoginNotesWidget />
                  </div>
              </Panel>

              <PanelResizeHandle className={styles.resizeHandleVertical} />

              {/* Bottom row: Weather, Voicenotes, Countdown */}
              <Panel defaultSize={40}>
                <PanelGroup direction="horizontal" className="panel-group">
                  <Panel defaultSize={33}>
                    <div className="panel-motion" style={fadeStyle(0.3)}>
                      <LoginWeatherWidget />
                    </div>
                  </Panel>
                  <PanelResizeHandle
                    className={styles.resizeHandleHorizontal}
                  />
                  <Panel defaultSize={33}>
                    <div className="panel-motion" style={fadeStyle(0.5)}>
                      <LoginRecorderWidget />
                    </div>
                  </Panel>
                  <PanelResizeHandle
                    className={styles.resizeHandleHorizontal}
                  />
                  <Panel defaultSize={34}>
                    <div className="panel-motion" style={fadeStyle(0.6)}>
                      <LoginCountdownWidget />
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandleHorizontal} />

          {/* Column 2: Login widget - roughly responsive */}
          <Panel defaultSize={22} minSize={22} maxSize={22}>
            <div className="panel-motion" style={fadeStyle(0.4)}>
              {login}
            </div>
          </Panel>

          <PanelResizeHandle className={styles.resizeHandleHorizontal} />

          {/* Column 3: Tasks and Schedule */}
          <Panel defaultSize={23} minSize={10}>
            <PanelGroup direction="vertical" className="panel-group">
              {/* Tasks */}
              <Panel defaultSize={50}>
                <div className="panel-motion" style={fadeStyle(0.2)}>
                  <LoginTasksWidget />
                </div>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandleVertical} />
              {/* Schedule */}
              <Panel defaultSize={50}>
                <div className="panel-motion" style={fadeStyle(0.7)}>
                  <LoginScheduleWidget />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
