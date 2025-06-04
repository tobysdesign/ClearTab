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
      <PanelGroup direction="vertical" className="h-full">
        {/* First Row: Notes and Tasks */}
        <Panel defaultSize={50} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={66} minSize={40} collapsible>
              <div className="h-full pr-2">
                <NotesWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 group flex items-center justify-center hover:w-2 transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground transition-colors rounded-full flex items-center justify-center group-hover:w-4">
                <GripVertical className="h-3 w-3 text-transparent group-hover:text-muted-foreground transition-colors" />
              </div>
            </PanelResizeHandle>
            <Panel defaultSize={34} minSize={25}>
              <div className="h-full pl-2">
                <TasksWidget />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="h-1 group flex items-center justify-center hover:h-2 transition-all duration-200">
          <div className="h-0.5 w-8 bg-border group-hover:bg-muted-foreground transition-colors rounded-full flex items-center justify-center group-hover:h-4">
            <GripHorizontal className="h-3 w-3 text-transparent group-hover:text-muted-foreground transition-colors" />
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
            <PanelResizeHandle className="w-1 group flex items-center justify-center hover:w-2 transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground transition-colors rounded-full flex items-center justify-center group-hover:w-4">
                <GripVertical className="h-3 w-3 text-transparent group-hover:text-muted-foreground transition-colors" />
              </div>
            </PanelResizeHandle>
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full px-1">
                <FinanceWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 group flex items-center justify-center hover:w-2 transition-all duration-200">
              <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground transition-colors rounded-full flex items-center justify-center group-hover:w-4">
                <GripVertical className="h-3 w-3 text-transparent group-hover:text-muted-foreground transition-colors" />
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