import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ResizableBentoGrid from "@/components/dashboard/resizable-bento-grid";
import ChatOverlay from "@/components/ai/chat-overlay";
import AgentInitFlow from "@/components/ai/agent-init-flow";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAgentInit } from "@/hooks/use-agent-init";
import { useChatContext } from "@/hooks/use-chat-context";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isFirstTime, isInitFlowOpen, closeInitFlow } = useAgentInit();
  const { isChatOpen, openChat, closeChat, initialMessage } = useKeyboardShortcuts();
  const { isChatOpen: chatContextOpen, setIsChatOpen } = useChatContext();

  // Check authentication status
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  useEffect(() => {
    document.title = "AI Productivity Dashboard";
  }, []);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!isLoading && (!user || error)) {
      setLocation("/");
    }
  }, [user, isLoading, error, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user || error) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-background/80 text-foreground min-h-screen">
        
        <ResizableBentoGrid />
        
        <ChatOverlay 
          isOpen={chatContextOpen}
          onClose={() => setIsChatOpen(false)}
          initialMessage={initialMessage}
          isSetupMode={isInitFlowOpen && chatContextOpen}
          onSetupComplete={closeInitFlow}
        />
      </div>
    </div>
  );
}
