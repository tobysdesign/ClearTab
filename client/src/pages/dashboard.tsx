import { useEffect } from "react";
import ResizableBentoGrid from "@/components/dashboard/resizable-bento-grid";
import ChatOverlay from "@/components/ai/chat-overlay";
import AgentInitFlow from "@/components/ai/agent-init-flow";
import FloatingAIButton from "@/components/floating-ai-button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAgentInit } from "@/hooks/use-agent-init";

export default function Dashboard() {
  const { isFirstTime, isInitFlowOpen, closeInitFlow } = useAgentInit();
  const { isChatOpen, openChat, closeChat, initialMessage } = useKeyboardShortcuts();

  useEffect(() => {
    document.title = "AI Productivity Dashboard";
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <ResizableBentoGrid />
      
      <FloatingAIButton />
      
      {isInitFlowOpen && (
        <AgentInitFlow 
          isOpen={isInitFlowOpen}
          onClose={closeInitFlow}
        />
      )}
      
      <ChatOverlay 
        isOpen={isChatOpen && !isInitFlowOpen}
        onClose={closeChat}
        initialMessage={initialMessage}
      />
    </div>
  );
}
