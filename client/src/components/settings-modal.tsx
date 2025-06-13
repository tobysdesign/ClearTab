import { useState } from "react";
import { MoreHorizontal, Settings as SettingsIcon, LogOut, User, Moon, Sun, Calendar, Bell, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer } from "vaul";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-black border border-gray-800 flex flex-col rounded-t-[10px] h-[70vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-600 mt-4 mb-6" />
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-white" />
              <h2 className="text-lg font-medium text-white">Settings</h2>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <DropdownMenuItem 
                      key={section.id} 
                      onClick={() => setActiveSection(section.id)}
                      className="text-gray-200 hover:bg-gray-800"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {section.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSection === "calendar" && (
              <div>
                <label className="text-xs font-medium text-white mb-1.5 block">
                  Calendar Integration
                </label>
                <CalendarSettings />
              </div>
            )}

            {activeSection === "account" && (
              <>
                <div>
                  <label className="text-xs font-medium text-white mb-1.5 block">
                    Theme Settings
                  </label>
                  <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-900">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-white" />
                      ) : (
                        <Sun className="h-4 w-4 text-white" />
                      )}
                      <div>
                        <div className="text-xs font-medium text-white">Dark Mode</div>
                        <div className="text-xs text-gray-400">Toggle theme</div>
                      </div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-white mb-1.5 block">
                    Account Actions
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-900">
                      <div>
                        <div className="text-xs font-medium text-white">Sign Out</div>
                        <div className="text-xs text-gray-400">End current session</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-900">
                      <div>
                        <div className="text-xs font-medium text-white">Switch Account</div>
                        <div className="text-xs text-gray-400">Choose different Google account</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/api/auth/google'}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Switch
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <div>
                <label className="text-xs font-medium text-white mb-1.5 block">
                  Notification Preferences
                </label>
                <div className="p-3 border border-gray-700 rounded bg-gray-900">
                  <div className="text-xs text-gray-400">
                    Notification preferences coming soon.
                  </div>
                </div>
              </div>
            )}

            {activeSection === "about" && (
              <div>
                <label className="text-xs font-medium text-white mb-1.5 block">
                  Application Info
                </label>
                <div className="p-3 border border-gray-700 rounded bg-gray-900 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Version</span>
                    <span className="text-xs font-medium text-white">1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Support</span>
                    <Button variant="outline" size="sm" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4">
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
              Done
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}