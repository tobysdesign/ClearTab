import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, LogOut, User, Moon, Sun, Calendar, Bell, Info, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CalendarSettings from "@/components/calendar-settings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("calendar");

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

  const sections = [
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "about", label: "About", icon: Info }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] [&>button]:hidden fixed right-4 top-1/2 -translate-y-1/2 left-auto transform-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-32 border-r border-border pr-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                      activeSection === section.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {activeSection === "calendar" && (
              <div>
                <CalendarSettings />
              </div>
            )}

            {activeSection === "account" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Account Settings</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-foreground" />
                      )}
                      <div>
                        <div className="text-xs font-medium text-foreground">Dark Mode</div>
                        <div className="text-xs text-muted-foreground">Toggle theme</div>
                      </div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded">
                    <div>
                      <div className="text-xs font-medium text-foreground">Sign Out</div>
                      <div className="text-xs text-muted-foreground">End current session</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="text-xs"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded">
                    <div>
                      <div className="text-xs font-medium text-foreground">Switch Account</div>
                      <div className="text-xs text-muted-foreground">Choose different Google account</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/api/auth/google'}
                      className="text-xs"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Switch
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Notifications</h3>
                </div>
                <div className="p-3 border border-border rounded">
                  <div className="text-xs text-muted-foreground">
                    Notification preferences coming soon.
                  </div>
                </div>
              </div>
            )}

            {activeSection === "about" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">About</h3>
                </div>
                <div className="p-3 border border-border rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Version</span>
                    <span className="text-xs font-medium text-foreground">1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Support</span>
                    <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground text-xs">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}