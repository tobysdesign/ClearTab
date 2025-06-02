import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatOverlay from "@/components/ai/chat-overlay";

export default function FloatingAIButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg z-40 p-0"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}