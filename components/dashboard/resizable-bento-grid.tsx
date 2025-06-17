'use client'

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { NotesWidget } from './widgets/notes-widget'
import { TasksWidget } from './widgets/tasks-widget'
import { ChatDock } from '../ai/chat-dock'
import { WeatherWidget } from './widgets/weather-widget'
import { FinanceWidget } from './widgets/finance-widget'
import { ScheduleWidget } from './widgets/schedule-widget'
// import { ProjectPlanningWidget } from "./widgets/project-planning-widget";

export function ResizableBentoGrid() {
  return (
    <div className="h-full w-full p-4 bg-background gap-4">
        <PanelGroup direction="vertical" className="h-full w-full">
            {/* Main content area */}
            <Panel defaultSize={75}>
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={66}>
                        <NotesWidget />
                    </Panel>
                    <PanelResizeHandle className="group w-2 bg-transparent flex items-center justify-center mx-2">
                        <div className="w-px h-full bg-border group-hover:bg-accent transition-colors" />
                    </PanelResizeHandle>
                    <Panel>
                        <TasksWidget />
                    </Panel>
                </PanelGroup>
            </Panel>

            <PanelResizeHandle className="group h-2 bg-transparent flex items-center justify-center my-2">
                <div className="h-px w-full bg-border group-hover:bg-accent transition-colors" />
            </PanelResizeHandle>

            {/* Bottom row widgets */}
            <Panel defaultSize={25}>
                <PanelGroup direction="horizontal">
                    <Panel>
                        <WeatherWidget />
                    </Panel>
                    <PanelResizeHandle className="group w-2 bg-transparent flex items-center justify-center mx-2">
                        <div className="w-px h-full bg-border group-hover:bg-accent transition-colors" />
                    </PanelResizeHandle>
                    <Panel>
                        <ScheduleWidget />
                    </Panel>
                     <PanelResizeHandle className="group w-2 bg-transparent flex items-center justify-center mx-2">
                        <div className="w-px h-full bg-border group-hover:bg-accent transition-colors" />
                    </PanelResizeHandle>
                    <Panel>
                        <FinanceWidget />
                    </Panel>
                </PanelGroup>
            </Panel>
        </PanelGroup>
        <ChatDock />
    </div>
  )
}

{/* <div className="col-span-1 row-span-1">
    <FinanceWidget />
</div>
<div className="col-span-1 row-span-1">
    <ScheduleWidget />
</div> */} 