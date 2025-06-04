import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/hooks/use-chat-context";
import { format, differenceInDays, addDays, addWeeks } from "date-fns";

interface UserPreferences {
  paydayDate: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly';
}

export default function FinanceWidget() {
  const { openChatWithPrompt } = useChatContext();
  
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const getNextPayday = () => {
    if (!preferences?.paydayDate) return null;
    
    const paydate = new Date(preferences.paydayDate);
    const today = new Date();
    let nextPayday = new Date(paydate);
    
    // Set to current year
    nextPayday.setFullYear(today.getFullYear());
    
    // If the date has already passed this month/period, calculate next occurrence
    if (nextPayday <= today) {
      switch (preferences.frequency) {
        case 'weekly':
          while (nextPayday <= today) {
            nextPayday = addWeeks(nextPayday, 1);
          }
          break;
        case 'fortnightly':
          while (nextPayday <= today) {
            nextPayday = addWeeks(nextPayday, 2);
          }
          break;
        case 'monthly':
        default:
          while (nextPayday <= today) {
            nextPayday = addDays(nextPayday, 30); // Approximate monthly
          }
          break;
      }
    }
    
    return nextPayday;
  };

  const formatPaydayText = () => {
    const nextPayday = getNextPayday();
    if (!nextPayday || !preferences) return "Set up your payday information";
    
    const daysUntil = differenceInDays(nextPayday, new Date());
    
    let timeText = "";
    switch (preferences.frequency) {
      case 'weekly':
        timeText = `${format(nextPayday, 'EEEE')}`;
        break;
      case 'fortnightly':
        timeText = `${format(nextPayday, 'EEEE do')}`;
        break;
      case 'monthly':
      default:
        timeText = `${format(nextPayday, 'do')}`;
        break;
    }
    
    if (daysUntil === 0) {
      return "Your payday is today!";
    } else if (daysUntil === 1) {
      return "Your next pay will be tomorrow!";
    } else {
      return `Your next pay will be in ${daysUntil} days, around the ${timeText}.`;
    }
  };

  return (
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
          Finance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-center leading-relaxed text-foreground">
            {formatPaydayText()}
          </p>
        </div>
        
        <div className="mt-auto pt-3 border-t border-border/50">
          <button 
            className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors"
            onClick={() => openChatWithPrompt("Help me manage my finances and budget")}
          >
            Manage finances
          </button>
        </div>
      </CardContent>
    </Card>
  );
}