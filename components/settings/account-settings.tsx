"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import User from "lucide-react/dist/esm/icons/user";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConnectedAccountWithEmail } from "@/shared/types";
import { useEffect } from "react";

export function AccountSettings() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // Debug logging
  useEffect(() => {
    console.log("AccountSettings mounted:", {
      user: user?.email,
      id: user?.id,
      loading,
      metadata: user?.user_metadata,
    });
  }, [user, loading]);

  const { data: isCalendarConnected, isLoading: calendarLoading } = useQuery({
    queryKey: ["googleCalendarConnected"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/status", {
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.connected;
    },
    enabled: !!user?.id,
  });

  const { data: connectedAccounts = [], isLoading: accountsLoading } = useQuery(
    {
      queryKey: ["connectedAccounts"],
      queryFn: async () => {
        const res = await fetch("/api/settings/accounts", {
          credentials: "include",
        });
        if (!res.ok) {
          console.error("Failed to fetch connected accounts:", res.status);
          return [];
        }
        const data = await res.json();
        console.log("Connected accounts:", data);
        // Filter out the primary account if it appears in the connected accounts list
        return data.filter(
          (account: ConnectedAccountWithEmail) =>
            account.providerAccountId !== user.user_metadata?.provider_id,
        ) as ConnectedAccountWithEmail[];
      },
      enabled: !!user?.id,
    },
  );

  const addAccountMutation = useMutation({
    mutationFn: async () => {
      // Fetch the custom auth URL from our new endpoint
      const response = await fetch("/api/auth/google-link-url?next=/settings");
      if (!response.ok) {
        throw new Error("Failed to get authorization URL.");
      }
      const { authUrl } = await response.json();
      // Redirect the user to Google
      window.location.href = authUrl;
    },
    onError: (error) => {
      console.error("Failed to initiate add account flow:", error);
      // You might want to show a toast notification here
    },
  });

  const removeAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/settings/accounts?id=${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to remove account");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
    },
  });

  const disconnectCalendarMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/settings/disconnect-calendar`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to disconnect calendar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["googleCalendarConnected"] });
    },
  });

  async function handleConnectCalendar() {
    try {
      const response = await fetch("/api/auth/connect-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: ["googleCalendarConnected"],
        });
      } else {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes:
              "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
      }
    } catch (error) {
      console.error("Error connecting calendar:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
          <div className="text-white/60 text-sm">
            Loading account information...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-yellow-400 mb-3">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Not signed in</span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            You need to sign in to manage your account settings.
          </p>
          <Button onClick={() => (window.location.href = "/login")} size="sm">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Account */}
      <div className="p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/60">Primary Account</h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white/60" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </div>
              <div className="text-xs text-white/60">
                {user.email || "No email"}
              </div>
            </div>
          </div>

          {calendarLoading ? (
            <div className="h-8 w-24 bg-[#1A1A1A] rounded animate-pulse" />
          ) : isCalendarConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectCalendarMutation.mutate()}
              disabled={disconnectCalendarMutation.isPending}
              className="h-8 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectCalendar}
              className="h-8 text-xs"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Additional Schedule Accounts */}
      <div className="p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-white/60 mb-1">
            Additional schedule accounts
          </h3>
          <p className="text-xs text-white/40">
            Accounts listed below are view only for visibility in schedule
            widget
          </p>
        </div>

        {accountsLoading ? (
          <div className="py-3">
            <div className="h-8 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
        ) : connectedAccounts.length > 0 ? (
          <div className="space-y-2">
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-white/90 truncate">
                      {account.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccountMutation.mutate(account.id)}
                  disabled={removeAccountMutation.isPending}
                  className="h-6 w-6 p-0 text-white/40 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between py-2">
            <p className="text-xs text-white/40">No additional accounts</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addAccountMutation.mutate()}
              disabled={addAccountMutation.isPending}
              className="h-7 text-xs hover:bg-white/5"
              title="Note: Adding an account will switch your primary account"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-[#111111] rounded-lg border border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">
            Signed in as <span className="text-white/80">{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/logout")}
            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
