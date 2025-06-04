import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
            <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors rounded-sm" />
            <Panel defaultSize={34} minSize={25}>
              <div className="h-full pl-2">
                <TasksWidget />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="h-2 bg-border hover:bg-border/80 transition-colors rounded-sm" />
        
        {/* Second Row: Weather, Finance, Events */}
        <Panel defaultSize={50} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full pr-1">
                <WeatherWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors rounded-sm" />
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full px-1">
                <FinanceWidget />
              </div>
            </Panel>
            <PanelResizeHandle className="w-2 bg-border hover:bg-border/80 transition-colors rounded-sm" />
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