import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserPreferences } from "@shared/schema";

export default function PaydayWidget() {
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const calculatePaydayInfo = () => {
    if (!preferences?.paydayDate) {
      return {
        daysLeft: 12,
        nextDate: "Dec 15"
      };
    }

    const today = new Date();
    const payday = new Date(preferences.paydayDate);
    const diffTime = payday.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      daysLeft: Math.max(0, daysLeft),
      nextDate: payday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const { daysLeft, nextDate } = calculatePaydayInfo();

  return (
    <div className="widget group">
      <div className="flex items-center justify-end mb-4">
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="text-center">
        <div className="text-4xl font-light mb-2 text-text-primary">
          {daysLeft}
        </div>
        <div className="text-sm text-text-secondary mb-3">
          Days to payday
        </div>
        <div className="space-y-2 text-xs text-text-muted">
          <div className="flex justify-between">
            <span>Next Date</span>
            <span>{nextDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Frequency</span>
            <span className="capitalize">{preferences?.paydayFrequency || 'Bi-weekly'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
