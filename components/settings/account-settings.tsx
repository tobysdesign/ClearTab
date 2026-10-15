"use client";

import * as React from "react";
import { Button } from "@cleartab/ui";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConnectedAccountWithEmail } from "@/shared/types";
import { AddIcon, MoreActionsIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";
import { apiFetch } from "@/lib/api-fetch";
import { useCalendarVisibility } from "@/hooks/use-calendar-visibility";
import { IS_EXTENSION, siteUrl } from "@/lib/platform";

interface AccountSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

export const AccountSettings = React.forwardRef<HTMLElement, AccountSettingsProps>(
  function AccountSettings({ sectionId, heading, description }, ref) {
    const { user, loading, signIn } = useAuth();
    const queryClient = useQueryClient();
    // Shared with the Schedule widget, which hides the accounts switched off here
    const { isVisible, setVisible } = useCalendarVisibility();
    const { toast } = useToast();

    const { data: connectedAccounts = [], isLoading: accountsLoading } = useQuery({
      queryKey: ["connectedAccounts"],
      enabled: !!user?.id,
      staleTime: 30_000,
      retry: false,
      queryFn: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const res = await apiFetch("/api/settings/accounts", {
            credentials: "include",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            console.error("Failed to fetch connected accounts:", res.status);
            return [];
          }

          return (await res.json()) as ConnectedAccountWithEmail[];
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn("Connected accounts check failed:", error);
          return [];
        }
      },
    });

    const addAccountMutation = useMutation({
      mutationFn: async () => {
        // Linking a Google account runs on the website (it needs the website's session), so
        // the extension opens the account settings there
        if (IS_EXTENSION) {
          window.open(siteUrl("/settings"), "_blank", "noopener");
          return;
        }

        const response = await apiFetch("/api/auth/google-link-url?next=/settings", {
          credentials: "include",
        });

        let payload: { authUrl?: unknown; message?: string } = {};
        try {
          payload = await response.json();
        } catch (error) {
          console.warn("Failed to parse google-link-url response", error);
        }

        if (!response.ok) {
          const reason =
            typeof payload.message === "string" && payload.message.length > 0
              ? payload.message
              : "Failed to get authorization URL.";
          throw new Error(reason);
        }

        const candidateUrls = [
          payload.authUrl,
          // handle possible backend variations
          (payload as Record<string, unknown>)?.url,
          (payload as Record<string, unknown>)?.authorizationUrl,
          (payload as Record<string, unknown>)?.authorization_url,
          (payload as Record<string, unknown>)?.redirectUrl,
        ] as Array<unknown>;

        const resolvedUrl = candidateUrls.find(
          (value): value is string => typeof value === "string" && value.length > 0,
        );

        if (!resolvedUrl) {
          console.error("Authorization URL missing from response", payload);
          throw new Error("Missing authorization URL.");
        }

        window.location.href = resolvedUrl;
      },
      onError: (error) => {
        console.error("Failed to start account linking", error);
        toast({
          title: "Unable to add account",
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong while starting the Google connection.",
          variant: "destructive",
        });
      },
    });

    const removeAccountMutation = useMutation({
      mutationFn: async (accountId: string) => {
        const res = await apiFetch(`/api/settings/accounts?id=${accountId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to remove account");
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
        // Removed account's events should disappear without a reload
        queryClient.invalidateQueries({ queryKey: ["schedule"] });
      },
    });

    // When accounts are added (after the connect redirect) or removed, refresh the schedule
    // so the change shows up without a manual reload.
    const prevAccountCount = React.useRef<number | null>(null);
    React.useEffect(() => {
      if (accountsLoading) return;
      const count = connectedAccounts.length;
      if (prevAccountCount.current !== null && prevAccountCount.current !== count) {
        queryClient.invalidateQueries({ queryKey: ["schedule"] });
      }
      prevAccountCount.current = count;
    }, [connectedAccounts, accountsLoading, queryClient]);


    const renderHeading = (actions?: React.ReactNode) => (
      <div className={sharedStyles.rowListHeader}>
        <div className={drawerStyles.sectionHeading}>
          <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
          {description ? (
            <p className={drawerStyles.sectionDescription}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className={sharedStyles.cardActions}>{actions}</div> : null}
      </div>
    );

    if (loading) {
      return (
        <section ref={ref} className={sharedStyles.card} data-section-id={sectionId}>
          <div className={sharedStyles.rowList}>
            {renderHeading()}
            <p className={sharedStyles.compactNotice}>Loading connected calendars…</p>
          </div>
        </section>
      );
    }

    if (!user) {
      return (
        <section ref={ref} className={sharedStyles.card} data-section-id={sectionId}>
          <div className={sharedStyles.rowList}>
            {renderHeading(
              <Button
                className={`${sharedStyles.button} ${sharedStyles.buttonPill}`}
                onClick={() => (IS_EXTENSION ? void signIn("google") : (window.location.href = "/login"))}
                tooltipLabel="Sign in"
                shortcut="⌘S"
              >
                Sign in
              </Button>,
            )}
            <p className={sharedStyles.compactNotice}>
              Sign in to connect calendars for the schedule widget.
            </p>
          </div>
        </section>
      );
    }

    const primaryKey = `primary-${user.id}`;

    return (
      <section ref={ref} className={sharedStyles.card} data-section-id={sectionId}>
        <div className={sharedStyles.rowList}>
          {renderHeading(
            <Button
              className={`${sharedStyles.button} ${sharedStyles.buttonPill}`}
              onClick={() => addAccountMutation.mutate()}
              disabled={addAccountMutation.isPending}
              tooltipLabel="Add Google account"
              shortcut="⌘A"
            >
              <AddIcon size={14} aria-hidden />
              Add account
            </Button>,
          )}

          <div className={sharedStyles.row}>
            <div>
              <div className={sharedStyles.rowLabelLine}>
                <div className={sharedStyles.label}>Name</div>
                <span className={`${sharedStyles.badge} ${sharedStyles.primaryBadge}`}>
                  Primary
                </span>
              </div>
              <div className={sharedStyles.rowTitle}>
                {user.name ||
                  user.email?.split("@")[0] ||
                  "Primary account"}
              </div>
            </div>
            <div>
              <div className={sharedStyles.label}>Address</div>
              <div className={sharedStyles.rowDescription}>{user.email ?? "No email"}</div>
            </div>
            <div className={sharedStyles.toggleGroup}>
              <span className={sharedStyles.label}>Visible</span>
              <Switch
                checked={isVisible(primaryKey)}
                onCheckedChange={(value) => setVisible(primaryKey, value)}
                aria-label="Toggle primary calendar visibility"
              />
            </div>
            <div className={sharedStyles.rowActions} />
          </div>

          {connectedAccounts.map((account) => (
            <div key={account.id} className={sharedStyles.row}>
              <div>
                <div className={sharedStyles.label}>Account</div>
                <div className={sharedStyles.rowTitle}>{account.email.split("@")[0]}</div>
              </div>
              <div>
                <div className={sharedStyles.label}>Email</div>
                <div className={sharedStyles.rowTitle}>{account.email}</div>
              </div>
              <div className={sharedStyles.toggleGroup}>
                <span className={sharedStyles.label}>Visible</span>
                <Switch
                  checked={isVisible(account.id)}
                  onCheckedChange={(value) => setVisible(account.id, value)}
                  aria-label={`Toggle visibility for ${account.email}`}
                />
              </div>
              <div className={sharedStyles.rowActions}>
                <Button
                  className={`${sharedStyles.button} ${sharedStyles.buttonIcon}`}
                  onClick={() => removeAccountMutation.mutate(account.id)}
                  disabled={removeAccountMutation.isPending}
                  aria-label={`Disconnect ${account.email}`}
                  tooltipLabel={`Disconnect ${account.email}`}
                  shortcut="⌘⌫"
                >
                  <MoreActionsIcon size={16} aria-hidden />
                </Button>
              </div>
            </div>
          ))}

          {accountsLoading && (
            <p className={sharedStyles.compactNotice}>Checking for additional calendars…</p>
          )}

          {!accountsLoading && connectedAccounts.length === 0 && (
            <p className={sharedStyles.compactNotice}>
              No additional calendars connected. Link another account to surface shared events.
            </p>
          )}
        </div>
      </section>
    );
  });

AccountSettings.displayName = "AccountSettings";
