import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AgentInitFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentInitFlow({ isOpen, onClose }: AgentInitFlowProps) {
  const [agentName, setAgentName] = useState("");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      localStorage.setItem('dashboardInitialized', 'true');
      toast({
        title: "Setup Complete",
        description: `Welcome ${userName}! I'm ${agentName}, ready to help.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteSetup = () => {
    if (!agentName.trim() || !userName.trim()) {
      toast({
        title: "Names Required",
        description: "Please enter both names to continue.",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate({ agentName: agentName.trim(), userName: userName.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCompleteSetup();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-overlay">
      <div className="chat-container animate-slide-up">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome to Your AI Assistant</h2>
          <p className="text-sm text-text-secondary">Let's get to know each other before we start working together.</p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <Label htmlFor="agentName" className="block text-sm font-medium text-text-primary mb-2">
                What would you like to call me?
              </Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Alex, Assistant, Helper..."
                className="w-full bg-secondary border-border text-text-primary placeholder-text-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="userName" className="block text-sm font-medium text-text-primary mb-2">
                What should I call you?
              </Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your preferred name..."
                className="w-full bg-secondary border-border text-text-primary placeholder-text-muted"
              />
            </div>
            
            <Card className="bg-secondary border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-text-primary mb-3">Here's what I can help you with:</h3>
                <ul className="space-y-2 text-xs text-text-secondary">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-text-muted" />
                    <span>Create and organize notes and tasks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-text-muted" />
                    <span>Remember our conversations with Mem0.ai</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-text-muted" />
                    <span>Quick shortcuts: #note and #task for instant creation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-text-muted" />
                    <span>Keyboard access: Press Ctrl+/ (or Cmd+/) anytime</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Confirmation System</h4>
                <p className="text-xs text-text-secondary">
                  I'll ask for confirmation before creating content, unless you use hashtag shortcuts for immediate creation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="p-6 border-t border-border">
          <Button 
            onClick={handleCompleteSetup}
            disabled={setupMutation.isPending || !agentName.trim() || !userName.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {setupMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 animate-pulse" />
                <span>Setting up...</span>
              </div>
            ) : (
              "Start Working Together"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
