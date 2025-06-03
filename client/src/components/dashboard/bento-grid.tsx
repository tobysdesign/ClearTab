import NotesWidget from "./notes-widget";
import TasksWidget from "./tasks-widget";
import WeatherWidget from "./weather-widget";
import FinanceWidget from "./finance-widget-fixed";
import CalendarWidget from "./calendar-widget";

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
