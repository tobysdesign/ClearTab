import { useState, useEffect } from "react";
import { 
  SmileFace, 
  SadFace, 
  BigEyeFace, 
  SidewaysFace, 
  DowntriddenFace, 
  UpconfusedFace 
} from "@/components/emotional-faces";
import { useChatContext } from "@/hooks/use-chat-context";

type AIChatbotState = "idle" | "thinking" | "responding";

interface AIChatbotFaceProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AIChatbotFace({ size = "md", className }: AIChatbotFaceProps) {
  const { isChatOpen } = useChatContext();
  const [currentState, setCurrentState] = useState<AIChatbotState>("idle");

  // Cycle through different emotional states for impact
  useEffect(() => {
    if (!isChatOpen) {
      setCurrentState("idle");
      return;
    }

    // When chat opens, show thinking state
    setCurrentState("thinking");
    
    // Add some dynamic behavior - cycle through states occasionally
    const interval = setInterval(() => {
      setCurrentState(prev => {
        const states: AIChatbotState[] = ["thinking", "responding", "idle"];
        const currentIndex = states.indexOf(prev);
        return states[(currentIndex + 1) % states.length];
      });
    }, 3000); // Change every 3 seconds when chat is open

    return () => clearInterval(interval);
  }, [isChatOpen]);

  // Render appropriate face based on state
  const renderFace = () => {
    switch (currentState) {
      case "thinking":
        return <UpconfusedFace size={size} className={className} />;
      case "responding":
        return <SmileFace size={size} className={className} />;
      case "idle":
      default:
        return <BigEyeFace size={size} className={className} />;
    }
  };

  return renderFace();
}