import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, LogOut, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CalendarSettings from "@/components/calendar-settings";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account."
      });
      queryClient.clear();
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your preferences and integrations</p>
        </div>

        <div className="grid gap-6">
          <CalendarSettings />
          
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Sign Out</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sign out of your current session
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Switch Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Sign out and choose a different Google account
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/api/auth/google'}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Switch Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Notification preferences coming soon.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}