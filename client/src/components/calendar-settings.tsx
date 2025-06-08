import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events with your schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Google Calendar</span>
            {status?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
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
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={handleConnect}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          )}
        </div>

        {status?.connected && status.lastSync && (
          <div className="text-xs text-muted-foreground">
            Last synced: {new Date(status.lastSync).toLocaleDateString()} at {new Date(status.lastSync).toLocaleTimeString()}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Benefits of connecting:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• View your Google Calendar events in the dashboard</li>
            <li>• Automatic sync with your existing schedule</li>
            <li>• Click events to open in Google Calendar</li>
            <li>• Real-time updates when you modify events</li>
          </ul>
        </div>

        {status?.error && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Sync Error: {status.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}