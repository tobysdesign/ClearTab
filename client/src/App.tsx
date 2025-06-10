import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider, useChatContext } from "@/hooks/use-chat-context";
import { FloatingDock } from "@/components/ui/floating-dock";
import { SmileFace, UpconfusedFace } from "@/components/emotional-faces";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import StyleGuide from "@/pages/style-guide-fixed";
import SilkTest from "@/pages/silk-test";
import SettingsModal from "@/components/settings-modal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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

  const dockItems = [
    {
      title: "Settings",
      icon: <SmileFace size="md" />,
      onClick: () => setIsSettingsOpen(true)
    },
    {
      title: "AI Assistant",
      icon: <UpconfusedFace size="md" />,
      onClick: () => setIsChatOpen(!isChatOpen)
    }
  ];

  return (
    <>
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50">
        <FloatingDock items={dockItems} />
      </div>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="productivity-ui-theme">
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
