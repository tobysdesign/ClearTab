import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, UserPreferences } from "@shared/schema";

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAnimated?: () => void;
  initialMessage?: string;
  modalRef?: React.RefObject<HTMLDivElement>;
}

export default function ChatOverlay({ isOpen, onClose, onCloseAnimated, initialMessage = "", modalRef }: ChatOverlayProps) {
  const [message, setMessage] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: isOpen,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      
      // If a task or note was created, refresh those widgets
      if (data.action === "create_task" || data.task) {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
      if (data.action === "create_note" || data.note) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      }
      if (data.note) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
        toast({
          title: "Note Created",
          description: `"${data.note.title}" has been added to your notes.`,
        });
      }
      if (data.task) {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        toast({
          title: "Task Created",
          description: `"${data.task.title}" has been added to your tasks.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const agentName = preferences?.agentName || "Alex";
  const userName = preferences?.userName || "User";

  useEffect(() => {
    if (isOpen) {
      // Reset states when opening
      setIsClosing(false);
      // Start animation immediately when opening
      setTimeout(() => setIsAnimating(true), 50);
      
      if (inputRef.current) {
        // Focus input after animation starts
        setTimeout(() => {
          inputRef.current?.focus();
          if (initialMessage && initialMessage !== message) {
            setMessage(initialMessage);
          }
        }, 100);
      }
    } else {
      // Reset animation states when closing
      setIsAnimating(false);
      setIsClosing(false);
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(message);
    setMessage("");
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      if (onCloseAnimated) {
        onCloseAnimated();
      } else {
        onClose();
      }
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4 transition-opacity duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      <div 
        ref={modalRef}
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md h-[80vh] flex flex-col"
        style={{
          transform: isClosing 
            ? 'translateY(100%) scale(0.95)' 
            : isAnimating 
              ? 'translateY(0) scale(1)' 
              : 'translateY(100%) scale(0.95)',
          transition: isClosing 
            ? 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)' 
            : 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transformOrigin: 'bottom center'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-text-secondary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-dark-primary" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">{agentName}</h3>
              <p className="text-xs text-text-muted">AI Assistant • Online</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto scroll-smooth" style={{ maxHeight: "60vh" }}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-dark-primary" />
                </div>
                <Card className="bg-secondary p-3 max-w-md">
                  <p className="text-sm text-text-primary">
                    Hi {userName}! I'm ready to help you with notes, tasks, and anything else you need. What would you like to work on?
                  </p>
                </Card>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3 animate-fade-in">
                {msg.role === "user" ? (
                  <>
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <Card className="bg-primary text-primary-foreground p-3 max-w-md">
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </Card>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-dark-primary" />
                    </div>
                    <Card className="bg-secondary p-3 max-w-md">
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{msg.message}</p>
                    </Card>
                  </>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-dark-primary" />
                </div>
                <Card className="bg-secondary p-3 max-w-md">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-text-muted rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                    <span className="text-xs text-text-muted">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex space-x-2 items-end">
            <textarea
              ref={inputRef}
              id="chatInput"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (try #note or #task for quick creation)"
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-3 text-text-primary placeholder-text-muted resize-none min-h-[60px] max-h-[120px] overflow-y-auto leading-relaxed"
              disabled={chatMutation.isPending}
              rows={2}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.max(60, target.scrollHeight) + 'px';
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || chatMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
            <span>Press Escape to close • Shift+Enter for new line</span>
            <div className="flex items-center space-x-1">
              <span>Memory:</span>
              <Badge variant="secondary" className="text-xs">
                Mem0.ai
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
