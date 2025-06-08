import { useState, useRef, useEffect } from "react";
import { Bot, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ChatOverlay from "@/components/ai/chat-overlay";
import { useChatContext } from "@/hooks/use-chat-context";
import { Drawer } from "vaul";

export default function FloatingAIButton() {
  const { isChatOpen, setIsChatOpen, openChatWithPrompt, initialPrompt } = useChatContext();
  const modalRef = useRef<HTMLDivElement>(null);
  const [hasUnfinishedSetup, setHasUnfinishedSetup] = useState(false);

  const handleButtonClick = () => {
    console.log('FAB clicked, isChatOpen:', isChatOpen);
    if (isChatOpen) {
      handleAnimatedClose();
    } else {
      console.log('Opening chat...');
      setIsChatOpen(true);
    }
  };

  const handleAnimatedClose = () => {
    console.log('Closing chat...');
    setIsChatOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleButtonClick();
      }
      if (e.key === "Escape" && isChatOpen) {
        handleAnimatedClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isChatOpen, setIsChatOpen, openChatWithPrompt]);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[10001] transition-all duration-300 ease-out">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleButtonClick}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 text-white shadow-lg p-0 group transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden"
              size="lg"
            >
              {/* Animated swirl background */}
              <div className="absolute inset-0 rounded-full opacity-30">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-1 rounded-full bg-gradient-to-l from-white/10 to-transparent animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
              </div>
              
              <div className="relative z-10 flex items-center justify-center w-6 h-6">
                {isChatOpen ? (
                  <X className="w-6 h-6 transition-all duration-200 group-hover:rotate-90" />
                ) : (
                  <MessageCircle className="w-6 h-6 transition-all duration-200 group-hover:rotate-12" />
                )}
              </div>
              {/* Notification indicator */}
              {hasUnfinishedSetup && !isChatOpen && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse z-20" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="mb-2">
            <p className="text-sm font-medium">
              {isChatOpen ? "Close Chat" : (hasUnfinishedSetup ? "Complete Setup" : "AI Assistant")}
            </p>
            <p className="text-xs text-muted-foreground">⌘K to toggle</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {isChatOpen && (
        <ChatOverlay 
          isOpen={isChatOpen}
          onClose={handleAnimatedClose}
          initialMessage={initialPrompt}
          modalRef={modalRef}
        />
      )}
    </>
  );
}