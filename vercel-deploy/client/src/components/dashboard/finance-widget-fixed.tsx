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
import { Calendar as CalendarIcon, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FinanceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"payday" | "budget">("payday");
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

  const calculateDailyBudget = () => {
    if (!preferences?.salary || !preferences?.expenses) return 0;
    
    const netIncome = preferences.salary - preferences.expenses;
    return Math.max(0, Math.round(netIncome / 30));
  };

  const daysUntilPayday = calculateDaysUntilPayday();
  const dailyBudget = calculateDailyBudget();

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
    <Card className="bg-card text-card-foreground border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">
          Finance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("payday")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeTab === "payday" 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pay
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeTab === "budget" 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Spend
            </button>
          </div>
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="center" side="bottom" sideOffset={8}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="salary" className="text-xs">Monthly Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="5000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expenses" className="text-xs">Monthly Expenses</Label>
                    <Input
                      id="expenses"
                      type="number"
                      placeholder="2000"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="frequency" className="text-xs">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payday-date" className="text-xs">Next Payday</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-8 text-sm justify-start font-normal",
                            !paydayDate && "text-muted-foreground"
                          )}
                        >
                          {paydayDate ? format(paydayDate, "MMM d") : "Set date"}
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
                </div>

                {salary && expenses && (
                  <div className="p-2 bg-muted rounded text-center">
                    <div className="text-xs text-muted-foreground">Net per period</div>
                    <div className="text-sm font-semibold text-green-600">
                      ${Math.round((parseInt(salary) - parseInt(expenses)) / (frequency === "weekly" ? 4.33 : frequency === "bi-weekly" ? 2.17 : 1))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSave} 
                  className="w-full h-8 text-sm"
                  disabled={updatePreferences.isPending}
                >
                  {updatePreferences.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "payday" ? (
            <div className="space-y-3">
              <div className="text-left">
                <div className="text-xs text-text-muted font-medium mb-2">Next Payday</div>
                {daysUntilPayday !== null ? (
                  <div>
                    <div className="text-3xl font-light text-text-primary">
                      {daysUntilPayday}
                    </div>
                    <div className="text-sm text-text-secondary mb-3">
                      {daysUntilPayday === 1 ? 'day' : 'days'}
                    </div>
                    {preferences?.paydayDate && (
                      <div className="text-xs text-text-muted">
                        {format(new Date(preferences.paydayDate), 'EEEE, MMM d')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4">
                    Set payday in settings
                  </div>
                )}
              </div>
              {preferences?.salary && preferences?.expenses && (
                <div className="text-left pt-2 border-t border-border/50">
                  <div className="text-xs text-text-muted mb-1">Net Pay</div>
                  <div className="text-lg font-medium text-green-600">
                    ${Math.round((preferences.salary - preferences.expenses) / (frequency === "weekly" ? 4.33 : frequency === "bi-weekly" ? 2.17 : 1))}
                  </div>
                  <div className="text-xs text-text-muted capitalize">
                    per {frequency.replace("-", " ")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-left">
                <div className="text-xs text-text-muted font-medium mb-2">Daily Budget</div>
                {dailyBudget > 0 ? (
                  <div>
                    <div className="text-3xl font-light text-text-primary">
                      ${dailyBudget}
                    </div>
                    <div className="text-sm text-text-secondary mb-3">
                      per day
                    </div>
                    <div className="text-xs text-text-muted">
                      Based on ${preferences?.salary || 0} salary - ${preferences?.expenses || 0} expenses
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4">
                    Set salary and expenses in settings
                  </div>
                )}
              </div>
              {preferences?.salary && preferences?.expenses && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Weekly budget</span>
                    <span className="text-text-primary">${(dailyBudget * 7).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Monthly budget</span>
                    <span className="text-text-primary">${(dailyBudget * 30).toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}