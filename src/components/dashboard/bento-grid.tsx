import NotesWidget from "./notes-widget-fixed";
import TasksWidget from "./tasks-widget";
import WeatherWidget from "./weather-widget-minimal";
import FinanceWidget from "./finance-widget-simple";
import CalendarWidget from "./calendar-widget-fixed";

export default function BentoGrid() {
  return (
    <div className="bento-grid">
      <NotesWidget />
      <TasksWidget />
      <WeatherWidget />
      <FinanceWidget />
      <CalendarWidget />
    </div>
  );
}
