"use client";

// Icons replaced with ASCII placeholders
import { Button } from "@/components/ui/button";
import { CloseIcon } from '@/components/icons';
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConnectedAccountWithEmail } from "@/shared/types";
import { useEffect } from "react";
import Image from "next/image";
import styles from "./account-settings.module.css";

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const res = await fetch("/api/calendar/status", {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return false;
        const data = await res.json();
        return data.connected;
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Calendar status check failed:', error);
        return false;
      }
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on failure
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: connectedAccounts = [], isLoading: accountsLoading } = useQuery(
    {
      queryKey: ["connectedAccounts"],
      queryFn: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const res = await fetch("/api/settings/accounts", {
            credentials: "include",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!res.ok) {
            console.error("Failed to fetch connected accounts:", res.status);
            return [];
          }
          const data = await res.json();
          console.log("Connected accounts:", data);
          // Filter out the primary account if it appears in the connected accounts list
          // Note: providerAccountId field not in type yet, so for now return all accounts
          return data as ConnectedAccountWithEmail[];
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn('Connected accounts check failed:', error);
          return [];
        }
      },
      enabled: !!user?.id,
      retry: false, // Don't retry on failure
      staleTime: 30000, // Cache for 30 seconds
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
      <div className={styles.spaceY4}>
        <div className={styles.card}>
          <div className={styles.textWhite60}>
            Loading account information...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.spaceY4}>
        <div className={styles.card}>
          <div className={`${styles.flexItemsGap2} ${styles.textYellow400} ${styles.mb3}`}>
            <span className={styles.iconSmall}>•</span>
            <span className={styles.textSmMedium}>Not signed in</span>
          </div>
          <p className={`${styles.textXsWhite60} ${styles.mb3}`}>
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
    <div className={styles.spaceY4}>
      {/* Schedule Section */}
      <div className={styles.card}>
        <div className={styles.mb3}>
          <h3 className={styles.sectionTitle}>Schedule</h3>
          <p className={styles.sectionDescription}>
            Accounts list here are shown in the schedule widget
          </p>
        </div>

        {/* Column Headers */}
        <div className={styles.columnHeaders}>
          <div className={styles.accountColumn}>Account</div>
          <div className={styles.visibilityColumn}>Visibility</div>
          <div className={styles.actionsColumn}>Actions</div>
        </div>

        {/* Primary Account */}
        <div className={styles.accountRow}>
          <div className={styles.accountColumn}>
            <div className={styles.accountItemContent}>
              <div className={styles.avatar}>
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt=""
                    fill
                    className={styles.avatarImage}
                  />
                ) : (
                  <span className={styles.userIcon}>👤</span>
                )}
              </div>
              <div className={styles.accountDetails}>
                <div className={styles.accountNameRow}>
                  <div className={styles.accountName}>
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "User"}
                  </div>
                  <span className={styles.primaryBadge}>Primary</span>
                </div>
                <div className={styles.accountEmail}>
                  {user.email || "No email"}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.visibilityColumn}>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                defaultChecked={true}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
          <div className={styles.actionsColumn}>
            {/* Empty for primary account */}
          </div>
        </div>

        {/* Additional Accounts */}
        {connectedAccounts.map((account) => (
          <div key={account.id} className={styles.accountRow}>
            <div className={styles.accountColumn}>
              <div className={styles.accountItemContent}>
                <div className={styles.avatar}>
                  <span className={styles.userIcon}>👤</span>
                </div>
                <div className={styles.accountDetails}>
                  <div className={styles.accountName}>
                    {account.email.split("@")[0]}
                  </div>
                  <div className={styles.accountEmail}>
                    {account.email}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.visibilityColumn}>
              <label className={styles.toggleSwitch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
            <div className={styles.actionsColumn}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAccountMutation.mutate(account.id)}
                disabled={removeAccountMutation.isPending}
                className={styles.menuButton}
              >
                ⋮
              </Button>
            </div>
          </div>
        ))}

        {/* Link additional Google Calendar */}
        <div className={styles.linkAccountItem}>
          <Button
            variant="ghost"
            onClick={() => addAccountMutation.mutate()}
            disabled={addAccountMutation.isPending}
            className={styles.linkAccountButton}
          >
            <span className={styles.iconPlus}>+</span>
            Link additional Google Calendar
          </Button>
        </div>
      </div>

      {/* Account Section */}
      <div className={styles.card}>
        <div className={styles.mb3}>
          <h3 className={styles.sectionTitle}>Account</h3>
          <p className={styles.sectionDescription}>
            The account you sign into Cleartab with
          </p>
        </div>

        <div className={styles.accountItem}>
          <div className={styles.accountItemContent}>
            <div className={styles.avatar}>
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt=""
                  fill
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.userIcon}>👤</span>
              )}
            </div>
            <div className={styles.accountDetails}>
              <div className={styles.accountName}>
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </div>
              <div className={styles.accountEmail}>
                {user.email || "No email"}
              </div>
            </div>
          </div>
          <div className={styles.accountActions}>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/logout")}
              className={styles.signOutButton}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
