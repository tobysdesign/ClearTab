import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  openChatWithPrompt: (prompt: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  initialPrompt: string;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  const openChatWithPrompt = (prompt: string) => {
    setInitialPrompt(prompt);
    setIsChatOpen(true);
  };

  return (
    <ChatContext.Provider value={{
      openChatWithPrompt,
      isChatOpen,
      setIsChatOpen,
      initialPrompt
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}