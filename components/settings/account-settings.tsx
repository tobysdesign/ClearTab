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
      {/* Primary Account */}
      <div className={styles.card}>
        <div className={styles.flexJustifyBetweenMb3}>
          <h3 className={styles.primaryAccountTitle}>Primary Account</h3>
        </div>

        <div className={styles.flexJustifyBetween}>
          <div className={styles.flexItemsGap3}>
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
            <div>
              <div className={styles.userNameText}>
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
              </div>
              <div className={styles.userEmailText}>
                {user.email || "No email"}
              </div>
            </div>
          </div>

          {calendarLoading ? (
            <div className={styles.loadingPlaceholder} />
          ) : isCalendarConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectCalendarMutation.mutate()}
              disabled={disconnectCalendarMutation.isPending}
              className={styles.disconnectButton}
            >
              <CloseIcon size={14} className="mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectCalendar}
              className={styles.disconnectButton}
            >
              <span className={styles.iconXsMr}>◊</span>
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Additional Schedule Accounts */}
      <div className={styles.card}>
        <div className={styles.mb3}>
          <h3 className={styles.additionalAccountsTitle}>
            Additional schedule accounts
          </h3>
          <p className={styles.additionalAccountsDescription}>
            Accounts listed below are view only for visibility in schedule
            widget
          </p>
        </div>

        {accountsLoading ? (
          <div className={styles.py3}>
            <div className={styles.loadingLine} />
          </div>
        ) : connectedAccounts.length > 0 ? (
          <div className={styles.spaceY2}>
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className={styles.accountItem}
              >
                <div className={styles.accountItemContent}>
                  <span className={styles.userIconSmall}>👤</span>
                  <div className={styles.accountDetails}>
                    <div className={styles.accountEmail}>
                      {account.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccountMutation.mutate(account.id)}
                  disabled={removeAccountMutation.isPending}
                  className={styles.removeButton}
                >
                  <CloseIcon size={12} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noAccountsRow}>
            <p className={styles.additionalAccountsDescription}>No additional accounts</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addAccountMutation.mutate()}
              disabled={addAccountMutation.isPending}
              className={styles.addAccountButton}
              title="Note: Adding an account will switch your primary account"
            >
              <span className={styles.iconXsMr1}>+</span>
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.card}>
        <div className={styles.flexJustifyBetween}>
          <div className={styles.signedInContainer}>
            Signed in as <span className={styles.signedInEmailSpan}>{user.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/logout")}
            className={styles.signOutButton}
          >
            <span className={styles.iconXsMr}>•</span>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
