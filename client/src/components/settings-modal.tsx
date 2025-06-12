import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, LogOut, User, Moon, Sun, Calendar, Bell, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import CalendarSettings from "@/components/calendar-settings";
import { motion, AnimatePresence } from "framer-motion";

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/60 z-[9999]"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal Content */}
          <motion.div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="w-full max-w-5xl h-full max-h-[85vh] bg-black/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl flex">
              {/* Sidebar */}
              <div className="w-48 border-r border-gray-800 p-4">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Settings
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Manage preferences</p>
                </div>
                
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          activeSection === section.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-900"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeSection === "calendar" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CalendarSettings />
                  </motion.div>
                )}

                {activeSection === "account" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                      <p className="text-sm text-gray-400">Manage your account preferences</p>
                    </div>

                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {theme === "dark" ? (
                              <Moon className="h-4 w-4 text-white" />
                            ) : (
                              <Sun className="h-4 w-4 text-white" />
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-white">Dark Mode</h4>
                              <p className="text-xs text-gray-400">Toggle theme</p>
                            </div>
                          </div>
                          <Switch
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-white">Sign Out</h4>
                            <p className="text-xs text-gray-400">End current session</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                            className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                          >
                            <LogOut className="h-3 w-3 mr-1" />
                            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-white">Switch Account</h4>
                            <p className="text-xs text-gray-400">Choose different Google account</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = '/api/auth/google'}
                            className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                          >
                            <User className="h-3 w-3 mr-1" />
                            Switch
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeSection === "notifications" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      <p className="text-sm text-gray-400">Configure notification preferences</p>
                    </div>
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-400">
                          Notification preferences coming soon.
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeSection === "about" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white">About</h3>
                      <p className="text-sm text-gray-400">Application information and support</p>
                    </div>
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Version</span>
                          <span className="text-sm font-medium text-white">1.0.0</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Support</span>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 text-sm">
                            Contact Support
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}