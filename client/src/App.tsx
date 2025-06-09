import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider, useChatContext } from "@/hooks/use-chat-context";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Settings, MessageCircle } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import StyleGuide from "@/pages/style-guide-fixed";
import SilkTest from "@/pages/silk-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/style" component={StyleGuide} />
      <Route path="/silk" component={SilkTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DockContent() {
  const [location, setLocation] = useLocation();
  const { isChatOpen, setIsChatOpen } = useChatContext();

  const dockItems = [
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      onClick: () => setLocation("/settings")
    },
    {
      title: "AI Assistant",
      icon: <MessageCircle className="h-5 w-5" />,
      onClick: () => setIsChatOpen(!isChatOpen)
    }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <FloatingDock items={dockItems} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <Toaster />
          <Router />
          <DockContent />
        </ChatProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
