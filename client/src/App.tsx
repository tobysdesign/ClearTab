import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider, useChatContext } from "@/hooks/use-chat-context";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Settings, X } from "lucide-react";
import { AIChatbotFace } from "@/components/ai-chatbot-face";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import StyleGuide from "@/pages/style-guide-fixed";
import SilkTest from "@/pages/silk-test";
import SettingsModal from "@/components/settings-modal";

function Router() {
  const isDevelopment = import.meta.env.DEV;
  
  return (
    <Switch>
      <Route path="/" component={isDevelopment ? Dashboard : Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/style" component={StyleGuide} />
      <Route path="/silk" component={SilkTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DockContent() {
  const [location, setLocation] = useLocation();
  const { isChatOpen, setIsChatOpen } = useChatContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  // Show dock on dashboard page (which could be at "/" in development)
  const shouldShowDock = location === '/dashboard' || (isDevelopment && location === '/');

  const dockItems = [
    {
      title: isSettingsOpen ? "Close Settings" : "Settings",
      icon: isSettingsOpen ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />,
      onClick: () => setIsSettingsOpen(!isSettingsOpen)
    },
    {
      title: isChatOpen ? "Close AI" : "AI Assistant",
      icon: isChatOpen ? <X className="h-5 w-5" /> : <AIChatbotFace size="md" />,
      onClick: () => setIsChatOpen(!isChatOpen)
    }
  ];

  return (
    <>
      {shouldShowDock && (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-[10001]">
          <FloatingDock items={dockItems} />
        </div>
      )}
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="productivity-ui-theme">
        <TooltipProvider>
          <ChatProvider>
            <Toaster />
            <Router />
            <DockContent />
          </ChatProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
