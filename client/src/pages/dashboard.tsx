import { useEffect } from "react";
import ResizableBentoGrid from "@/components/dashboard/resizable-bento-grid";
import ChatOverlay from "@/components/ai/chat-overlay";
import AgentInitFlow from "@/components/ai/agent-init-flow";
import FloatingAIButton from "@/components/floating-ai-button";
import Silk from "@/components/ui/silk";
import SilkErrorBoundary from "@/components/ui/silk-error-boundary";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAgentInit } from "@/hooks/use-agent-init";

export default function Dashboard() {
  const { isFirstTime, isInitFlowOpen, closeInitFlow } = useAgentInit();
  const { isChatOpen, openChat, closeChat, initialMessage } = useKeyboardShortcuts();

  useEffect(() => {
    document.title = "AI Productivity Dashboard";
  }, []);

  return (
    <SilkErrorBoundary 
      fallbackColor="#7B7481"
      className="min-h-screen"
    >
      <Silk 
        speed={3}
        scale={1.2}
        color="#7B7481"
        noiseIntensity={1.8}
        rotation={0.1}
        className="min-h-screen"
      >
        <div className="bg-background/80 text-foreground min-h-screen backdrop-blur-sm">
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
      </Silk>
    </SilkErrorBoundary>
  );
}
