import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, X, Send, ExternalLink, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, UserPreferences } from "@shared/schema";

interface SetupFlowProps {
  onSetupComplete?: () => void;
}

const SetupFlow = ({ onSetupComplete }: SetupFlowProps) => {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState("t0by");
  const [userName, setUserName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const setupMutation = useMutation({
    mutationFn: async (data: { agentName: string; userName: string }) => {
      return apiRequest("POST", "/api/preferences", {
        agentName: data.agentName,
        userName: data.userName,
        initialized: true,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      localStorage.setItem('dashboardInitialized', 'true');
      
      // Send welcome message to chat
      try {
        await apiRequest("POST", "/api/chat", {
          message: `Perfect! I'm ${agentName}, your AI assistant. I'm here to help you with tasks, notes, and productivity. You can use hashtags like #note or #task for quick creation. How can I help you today?`,
          useMemory: false
        });
        queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      } catch (error) {
        console.error("Failed to send welcome message:", error);
      }
      
      toast({
        title: "Setup Complete",
        description: `Welcome! ${agentName} is ready to help you.`,
      });
      onSetupComplete?.();
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setStep(3);
    }
  };

  const handleSetupComplete = () => {
    setupMutation.mutate({ agentName, userName });
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 text-dark-primary" />
            </div>
            <Card className="bg-secondary p-4 max-w-md w-full">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-primary">Welcome to your AI Productivity Dashboard!</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  I help you manage tasks, notes, and boost productivity. Features include:
                  • Smart task and note creation with #hashtags
                  • Optional local memory with Mem0 for personalized assistance  
                  • Privacy-focused design - your data stays secure
                  • Weather, calendar, and chat integration
                </p>
              </div>
            </Card>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 text-dark-primary" />
            </div>
            <Card className="bg-secondary p-4 max-w-md w-full">
              <div className="space-y-3">
                <p className="text-sm text-text-primary">
                  I'm <button 
                    onClick={() => setStep(2)} 
                    className="text-primary hover:underline font-medium"
                  >
                    {agentName}
                  </button>, but you can rename me if you'd like (just click my name)
                </p>
                <p className="text-sm text-text-primary">What would you like to be called?</p>
                <div className="flex space-x-2">
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Type your name"
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        handleNameSubmit();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleNameSubmit}
                    disabled={!userName.trim()}
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="h-3 w-3 text-dark-primary" />
          </div>
          <Card className="bg-secondary p-4 max-w-md w-full">
            <div className="space-y-3">
              <p className="text-sm text-text-primary">What would you like to call me?</p>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setStep(1);
                  }
                }}
              />
              <Button 
                onClick={() => setStep(1)} 
                size="sm" 
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-text-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 text-dark-primary" />
            </div>
            <Card className="bg-secondary p-4 max-w-md w-full">
              <div className="space-y-3">
                <p className="text-sm text-text-primary">
                  Great! Would you like to connect your Google Calendar to sync your events with the dashboard?
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => window.location.href = '/api/auth/google'}
                  >
                    Connect Google Calendar
                  </Button>
                  <Button 
                    onClick={handleSetupComplete}
                    size="sm" 
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAnimated?: () => void;
  initialMessage?: string;
  modalRef?: React.RefObject<HTMLDivElement>;
  isSetupMode?: boolean;
  onSetupComplete?: () => void;
}

export default function ChatOverlay({ isOpen, onClose, onCloseAnimated, initialMessage = "", modalRef, isSetupMode = false, onSetupComplete }: ChatOverlayProps) {
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
      
      // Handle setup completion
      if (data.setupComplete) {
        queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
        localStorage.setItem('dashboardInitialized', 'true');
        toast({
          title: "Setup Complete",
          description: "Your AI assistant is ready to help!",
        });
        onSetupComplete?.();
      }
      
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

  const agentName = preferences?.agentName || "t0by";
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
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4 pb-20 transition-opacity duration-300 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      <div 
        ref={modalRef}
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md h-[70vh] flex flex-col"
        style={{
          transform: isClosing 
            ? 'translateY(100%) scale(0.95)' 
            : isAnimating 
              ? 'translateY(0) scale(1)' 
              : 'translateY(100%) scale(0.95)',
          transition: isClosing 
            ? 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transformOrigin: 'bottom center'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border pt-[6px] pb-[6px]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-text-secondary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-dark-primary" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">{agentName}</h3>
              <p className="text-xs text-text-muted">AI Assistant</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto scroll-smooth" style={{ maxHeight: "60vh" }}>
          <div className="space-y-4">
            {isSetupMode ? (
              <SetupFlow onSetupComplete={onSetupComplete} />
            ) : messages.length === 0 ? (
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
            ) : null}
            
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
          <div className="relative">
            <textarea
              ref={inputRef}
              id="chatInput"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-secondary border border-border rounded-md pl-3 pr-12 py-3 text-sm text-text-primary placeholder-text-muted resize-none min-h-[60px] max-h-[120px] overflow-y-auto leading-relaxed"
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
              className="absolute right-2 bottom-2 bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-text-muted text-center">
            <span className="italic">Try adding <strong>#note</strong> or <strong>#task</strong> in your message</span>
          </div>
        </div>
      </div>
    </div>
  );
}
