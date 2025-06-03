import NotesWidget from "./notes-widget";
import TasksWidget from "./tasks-widget";
import WeatherWidget from "./weather-widget";
import EnhancedPaydayWidget from "./enhanced-payday-widget";
import CalendarWidget from "./calendar-widget";
import BudgetWidget from "./budget-widget";

export default function BentoGrid() {
  return (
    <div className="bento-grid">
      <NotesWidget />
      <TasksWidget />
      <WeatherWidget />
      <EnhancedPaydayWidget />
      <BudgetWidget />
      <CalendarWidget />
    </div>
  );
}
