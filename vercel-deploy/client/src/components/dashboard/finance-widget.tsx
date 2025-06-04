import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPreferences } from "@shared/schema";
import { Calendar as CalendarIcon, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FinanceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [paydayDate, setPaydayDate] = useState<Date>();
  const [frequency, setFrequency] = useState("bi-weekly");
  const [salary, setSalary] = useState("");
  const [expenses, setExpenses] = useState("2000");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const updatePreferences = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiRequest("PATCH", "/api/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      setIsOpen(false);
      toast({
        title: "Settings Updated",
        description: "Your financial preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updatePreferences.mutate({
      paydayDate,
      paydayFrequency: frequency,
      salary: parseInt(salary) || 0,
      expenses: parseInt(expenses) || 2000,
    });
  };

  const calculateDaysUntilPayday = () => {
    if (!preferences?.paydayDate) return null;
    
    const today = new Date();
    const payday = new Date(preferences.paydayDate);
    
    if (payday < today) {
      const freq = preferences.paydayFrequency || "bi-weekly";
      
      if (freq === "weekly") {
        payday.setDate(payday.getDate() + 7);
      } else if (freq === "bi-weekly") {
        payday.setDate(payday.getDate() + 14);
      } else if (freq === "monthly") {
        payday.setMonth(payday.getMonth() + 1);
      }
    }
    
    const diffTime = payday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const calculateNetPayPerPeriod = () => {
    if (!preferences?.salary || !preferences?.expenses) return 0;
    
    const netMonthly = preferences.salary - preferences.expenses;
    const freq = preferences.paydayFrequency || "bi-weekly";
    
    if (freq === "weekly") return Math.round(netMonthly / 4.33);
    if (freq === "bi-weekly") return Math.round(netMonthly / 2.17);
    if (freq === "monthly") return netMonthly;
    
    return 0;
  };

  const calculateDailyBudget = () => {
    if (!preferences?.salary || !preferences?.expenses) return 0;
    
    const netIncome = preferences.salary - preferences.expenses;
    return Math.max(0, Math.round(netIncome / 30));
  };

  const daysUntilPayday = calculateDaysUntilPayday();
  const netPay = calculateNetPayPerPeriod();
  const dailyBudget = calculateDailyBudget();
  
  // Mock current spending for today
  const todaySpent = Math.floor(Math.random() * (dailyBudget * 1.2));
  const remaining = dailyBudget - todaySpent;
  const percentUsed = dailyBudget > 0 ? (todaySpent / dailyBudget) * 100 : 0;

  const getBudgetStatus = () => {
    if (percentUsed <= 60) return { color: "bg-green-500", status: "On Track" };
    if (percentUsed <= 90) return { color: "bg-yellow-500", status: "Watch Spending" };
    return { color: "bg-red-500", status: "Over Budget" };
  };

  const budgetStatus = getBudgetStatus();

  // Initialize form with current preferences when opening
  const handleOpenChange = (open: boolean) => {
    if (open && preferences) {
      setPaydayDate(preferences.paydayDate ? new Date(preferences.paydayDate) : undefined);
      setFrequency(preferences.paydayFrequency || "bi-weekly");
      setSalary(preferences.salary?.toString() || "");
      setExpenses(preferences.expenses?.toString() || "2000");
    }
    setIsOpen(open);
  };

  return (
    <Card className="bg-card text-card-foreground border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-end">
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end" side="bottom" sideOffset={5}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payday-date">Payday Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !paydayDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paydayDate ? format(paydayDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paydayDate}
                        onSelect={setPaydayDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Pay Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Monthly Salary ($)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="5000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenses">Monthly Expenses ($)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    placeholder="2000"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                  />
                </div>

                {salary && expenses && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Net Pay Per Period</div>
                    <div className="text-lg font-bold text-green-600">
                      ${Math.round((parseInt(salary) - parseInt(expenses)) / (frequency === "weekly" ? 4.33 : frequency === "bi-weekly" ? 2.17 : 1))}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      Every {frequency.replace("-", " ")}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSave} 
                  className="w-full"
                  disabled={updatePreferences.isPending}
                >
                  {updatePreferences.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Payday Section */}
          <div className="space-y-2 text-left">
            <div className="text-xs text-muted-foreground font-medium">Next Payday</div>
            {daysUntilPayday !== null ? (
              <div>
                <div className="text-xl font-bold text-primary">
                  {daysUntilPayday}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysUntilPayday === 1 ? 'day' : 'days'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                Set payday
              </div>
            )}
          </div>

          {/* Daily Budget Section */}
          <div className="space-y-2 text-left">
            <div className="text-xs text-muted-foreground font-medium">Est. Daily Spend</div>
            {dailyBudget > 0 ? (
              <div>
                <div className="text-xl font-bold text-primary">
                  ${dailyBudget}
                </div>
                <div className="text-xs text-muted-foreground">
                  per day
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                Set salary
              </div>
            )}
          </div>
        </div>
        
        {/* Frequency indicator */}
        {preferences?.paydayFrequency && (
          <div className="text-center border-t pt-2">
            <div className="text-xs text-muted-foreground capitalize">
              {preferences.paydayFrequency.replace("-", " ")} payments
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}