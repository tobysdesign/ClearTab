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
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import type { ChatMessage, UserPreferences } from "@shared/schema";

interface SetupFlowProps {
  onSetupComplete?: () => void;
}

const SetupFlow = ({ onSetupComplete }: SetupFlowProps) => {
  const [showNameInput, setShowNameInput] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipRemainingSteps, setSkipRemainingSteps] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updatePreferences } = useMutation({
    mutationFn: (data: { agentName: string }) => 
      apiRequest("/api/preferences", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      setIsSubmitting(false);
      if (onSetupComplete) onSetupComplete();
      toast({
        title: "Setup complete!",
        description: `Your AI assistant ${agentName} is ready to help.`,
      });
    },
    onError: () => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSetupComplete = () => {
    if (showNameInput && agentName.trim()) {
      setIsSubmitting(true);
      updatePreferences({ agentName: agentName.trim() });
    } else if (onSetupComplete) {
      onSetupComplete();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background/50 to-muted/30 rounded-lg border">
      {!skipRemainingSteps && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to your AI Dashboard</h3>
            <p className="text-muted-foreground text-sm">
              Let's get your personal assistant set up in just a few seconds.
            </p>
          </div>

          {!showNameInput ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                <Button 
                  onClick={() => setShowNameInput(true)}
                  className="w-full"
                >
                  Customize AI Assistant Name
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSkipRemainingSteps(true)}
                  className="w-full"
                >
                  Use Default Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Assistant Name</Label>
                <Input
                  id="agent-name"
                  placeholder="e.g., Alex, Sage, Nova..."
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a name for your AI assistant (optional)
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetupComplete}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowNameInput(false)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {skipRemainingSteps && (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">You're all set!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your assistant is ready to help you manage tasks, notes, and more.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/api/auth/google'}
                variant="outline"
                className="w-full text-xs"
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
    enabled: isOpen,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: isOpen && !isSetupMode,
    refetchInterval: 2000,
  });

  const agentName = preferences?.agentName || "Assistant";

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (data: { message: string }) => 
      apiRequest("/api/chat/send", "POST", data),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (initialMessage) {
        setMessage(initialMessage);
      }
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!message.trim() || isSending) return;
    sendMessage({ message: message.trim() });
  };

  const handleClose = () => {
    // Use Vaul's native close behavior for consistent animation
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/40 z-[9999]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Chat Content */}
          <motion.div 
            ref={modalRef}
            className="bg-background border border-border rounded-t-[16px] shadow-2xl fixed bottom-20 left-0 right-0 h-[75vh] max-w-md mx-auto flex flex-col outline-none z-[10000]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4
            }}
          >
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mt-[-4px] mb-[-4px]" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border pt-[0px] pb-[0px]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{agentName}</h3>
                <p className="text-xs text-muted-foreground">AI Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {isSetupMode ? (
              <div className="flex-1 p-4">
                <SetupFlow onSetupComplete={onSetupComplete} />
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium text-foreground mb-2">How can I help you today?</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        I can help you manage tasks, take notes, schedule events, and answer questions.
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground ml-12" 
                          : "bg-muted text-foreground mr-12"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground rounded-lg px-3 py-2 mr-12">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex space-x-2">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-1 resize-none border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[40px] max-h-32"
                      rows={1}
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    <span className="italic">Try adding <strong>#note</strong> or <strong>#task</strong> in your message</span>
                  </div>
                </div>
              </>
            )}
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}