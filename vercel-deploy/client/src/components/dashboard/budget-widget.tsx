import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { UserPreferences } from "@shared/schema";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function BudgetWidget() {
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const calculateDailyBudget = () => {
    if (!preferences?.salary || !preferences?.expenses) {
      return 0;
    }
    
    const netIncome = preferences.salary - preferences.expenses;
    return Math.max(0, Math.round(netIncome / 30)); // Approximate monthly to daily
  };

  const dailyBudget = calculateDailyBudget();
  
  // Mock current spending for today (would be real data in production)
  const todaySpent = Math.floor(Math.random() * (dailyBudget * 1.2));
  const remaining = dailyBudget - todaySpent;
  const percentUsed = dailyBudget > 0 ? (todaySpent / dailyBudget) * 100 : 0;

  const getBudgetStatus = () => {
    if (percentUsed <= 60) return { color: "bg-green-500", status: "On Track" };
    if (percentUsed <= 90) return { color: "bg-yellow-500", status: "Watch Spending" };
    return { color: "bg-red-500", status: "Over Budget" };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <Card className="bg-card text-card-foreground border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Daily Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dailyBudget > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Budget</span>
                <span className="text-sm font-medium">${dailyBudget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Spent</span>
                <span className="text-sm font-medium">${todaySpent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Remaining</span>
                <span className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remaining}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${budgetStatus.color}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {budgetStatus.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {remaining >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  {Math.round(percentUsed)}%
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-xs text-muted-foreground py-4">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Set up salary in payday settings to track daily budget</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}