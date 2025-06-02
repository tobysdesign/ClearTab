import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatOverlay from "@/components/ai/chat-overlay";
import { useChatContext } from "@/hooks/use-chat-context";

export default function FloatingAIButton() {
  const { isChatOpen, setIsChatOpen, openChatWithPrompt, initialPrompt } = useChatContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsChatOpen(!isChatOpen);
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
        setIsChatOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen, openChatWithPrompt]);

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg z-40 p-0"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        initialMessage={initialPrompt}
      />
    </>
  );
}