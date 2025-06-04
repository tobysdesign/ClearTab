import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatContext } from "@/hooks/use-chat-context";
import { format, differenceInDays, addDays, addWeeks } from "date-fns";

interface UserPreferences {
  paydayDate: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly';
}

export default function FinanceWidget() {
  const { openChatWithPrompt } = useChatContext();
  const [activeTab, setActiveTab] = useState("pay");
  
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
      <CardContent className="space-y-3 flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('pay')}
              className={`px-2 py-1 text-xs font-medium transition-colors rounded ${
                activeTab === 'pay'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Pay
            </button>
            <button
              onClick={() => setActiveTab('spend')}
              className={`px-2 py-1 text-xs font-medium transition-colors rounded ${
                activeTab === 'spend'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Spend
            </button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <button
                  onClick={() => openChatWithPrompt("Help me set up my payday information and frequency")}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                >
                  Set Payday Details
                </button>
                <button
                  onClick={() => openChatWithPrompt("Help me track my monthly expenses and spending")}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                >
                  Manage Expenses
                </button>
                <button
                  onClick={() => openChatWithPrompt("Help me create a budget plan")}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-accent rounded"
                >
                  Budget Planning
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          {activeTab === 'pay' ? (
            <p className="text-sm text-center leading-relaxed text-foreground">
              {formatPaydayText()}
            </p>
          ) : (
            <p className="text-sm text-center leading-relaxed text-muted-foreground">
              Track your spending and expenses here
            </p>
          )}
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