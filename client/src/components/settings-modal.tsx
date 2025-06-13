import { useState, useRef } from "react";
import { MoreHorizontal, Settings as SettingsIcon, LogOut, User, Moon, Sun, Calendar, Bell, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
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
  const modalRef = useRef<HTMLDivElement>(null);

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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />
          
          {/* Settings Content */}
          <motion.div 
            ref={modalRef}
            className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl fixed bottom-20 left-0 right-0 h-[420px] max-w-sm mx-auto flex flex-col outline-none z-[10000]"
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.4
            }}
          >
            {/* Drag handle */}
            <div className="mx-auto w-8 h-1 flex-shrink-0 rounded-full bg-gray-600 mt-2 mb-1" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <SettingsIcon className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Settings</h3>
                  <p className="text-xs text-gray-400">Configure preferences</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-6 w-6 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Section Navigation */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        variant={activeSection === section.id ? "default" : "ghost"}
                        size="sm"
                        className={`h-7 px-2 text-xs ${
                          activeSection === section.id
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {section.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Section Content */}
                {activeSection === "calendar" && (
                  <div className="space-y-3">
                    <CalendarSettings />
                  </div>
                )}

                {activeSection === "account" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-900">
                      <div className="flex items-center gap-2">
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
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-900">
                        <div>
                          <div className="text-xs font-medium text-white">Sign Out</div>
                          <div className="text-xs text-gray-400">End session</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600"
                        >
                          <LogOut className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "notifications" && (
                  <div className="p-3 border border-gray-700 rounded bg-gray-900">
                    <div className="text-xs text-gray-400">
                      Notification preferences coming soon.
                    </div>
                  </div>
                )}

                {activeSection === "about" && (
                  <div className="p-3 border border-gray-700 rounded bg-gray-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Version</span>
                      <span className="text-xs font-medium text-white">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Support</span>
                      <Button variant="outline" size="sm" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600">
                        Contact
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}