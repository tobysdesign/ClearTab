import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GripVertical, GripHorizontal } from "lucide-react";
import NotesWidget from "./notes-widget-collapsible";
import TasksWidget from "./tasks-widget";
import WeatherWidget from "./weather-widget-minimal";
import FinanceWidget from "./finance-widget-simple";
import CalendarWidget from "./calendar-widget-fixed";

export default function ResizableBentoGrid() {
  return (
    <div className="h-[calc(100vh-2rem)] p-4">
      <PanelGroup direction="vertical" className="h-full" style={{ rowGap: '6px' }}>
        {/* First Row: Notes and Tasks */}
        <Panel defaultSize={50} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={66} minSize={40} collapsible>
              <div className="h-full pr-1">
                <NotesWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 group flex items-center justify-center transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground/70 transition-colors rounded-full flex items-center justify-center group-hover:w-3">
                <GripVertical className="h-2 w-2 text-transparent group-hover:text-muted-foreground/70 transition-colors" />
              </div>
            </PanelResizeHandle>
            <Panel defaultSize={34} minSize={25}>
              <div className="h-full pl-1">
                <TasksWidget />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="h-1 group flex items-center justify-center transition-all duration-200">
          <div className="h-0.5 w-8 bg-border group-hover:bg-muted-foreground/70 transition-colors rounded-full flex items-center justify-center group-hover:h-2">
            <GripHorizontal className="h-1.5 w-1.5 text-transparent group-hover:text-muted-foreground/70 transition-colors" />
          </div>
        </PanelResizeHandle>
        
        {/* Second Row: Weather, Finance, Events */}
        <Panel defaultSize={50} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full pr-1">
                <WeatherWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 group flex items-center justify-center transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground/70 transition-colors rounded-full flex items-center justify-center group-hover:w-3">
                <GripVertical className="h-2 w-2 text-transparent group-hover:text-muted-foreground/70 transition-colors" />
              </div>
            </PanelResizeHandle>
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full px-1">
                <FinanceWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 group flex items-center justify-center transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground/70 transition-colors rounded-full flex items-center justify-center group-hover:w-3">
                <GripVertical className="h-2 w-2 text-transparent group-hover:text-muted-foreground/70 transition-colors" />
              </div>
            </PanelResizeHandle>
            <Panel defaultSize={34} minSize={25}>
              <div className="h-full pl-1">
                <CalendarWidget />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}