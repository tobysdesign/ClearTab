import { useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatOverlay from "@/components/ai/chat-overlay";
import { useChatContext } from "@/hooks/use-chat-context";

export default function FloatingAIButton() {
  const { isChatOpen, setIsChatOpen, openChatWithPrompt, initialPrompt } = useChatContext();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleAnimatedClose = () => {
    setIsChatOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isChatOpen) {
          handleAnimatedClose();
        } else {
          setIsChatOpen(true);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openChatWithPrompt("Create a new note for me");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        openChatWithPrompt("Create a new task for me");
      }
      if (e.key === 'Escape' && isChatOpen) {
        handleAnimatedClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen, openChatWithPrompt]);

  return (
    <>
      <Button
        onClick={() => isChatOpen ? handleAnimatedClose() : setIsChatOpen(true)}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg z-[10001] p-0 group transition-all duration-200 hover:scale-110 active:scale-95"
        size="lg"
      >
        <MessageCircle className={`w-6 h-6 transition-all duration-200 ${isChatOpen ? 'group-hover:opacity-0 group-hover:scale-0' : 'group-hover:rotate-12'}`} />
        {isChatOpen && (
          <X className="absolute w-6 h-6 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200" />
        )}
      </Button>
      
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onCloseAnimated={handleAnimatedClose}
        initialMessage={initialPrompt}
        modalRef={modalRef}
      />
    </>
  );
}