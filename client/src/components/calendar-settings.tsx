import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CalendarSyncStatus } from "@shared/calendar-types";

export default function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: status, isLoading } = useQuery<CalendarSyncStatus>({
    queryKey: ["/api/calendar/status"],
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/calendar/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    window.location.href = "/api/auth/google";
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Integration
          </h3>
        </div>
        <div className="p-3 border border-border rounded">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Calendar Integration
        </h3>
        <p className="text-xs text-muted-foreground">
          Connect your Google Calendar to sync events with your schedule
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border border-border rounded">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Google Calendar</span>
            {status?.connected ? (
              <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          
          {status?.connected ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="text-xs"
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={handleConnect}
              className="text-xs flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Connect Google Calendar
            </Button>
          )}
        </div>

        {status?.connected && status.lastSync && (
          <div className="text-xs text-muted-foreground p-3 border border-border rounded">
            Last synced: {new Date(status.lastSync).toLocaleDateString()} at {new Date(status.lastSync).toLocaleTimeString()}
          </div>
        )}

        <div className="p-3 border border-border rounded">
          <h4 className="text-xs font-medium text-foreground mb-2">Benefits of connecting:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• View your Google Calendar events in the dashboard</li>
            <li>• Automatic sync with your existing schedule</li>
            <li>• Click events to open in Google Calendar</li>
            <li>• Real-time updates when you modify events</li>
          </ul>
        </div>

        {status?.error && (
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-xs text-red-800">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Sync Error: {status.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}