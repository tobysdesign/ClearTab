import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getApiSession } from "@/lib/auth/api-session";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable, connectedAccounts } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";

type ReconnectState = { reason: "revoked" | "not_connected"; message: string };

// Events from the extra Google accounts connected in Settings (work, personal...), tagged with
// the account they came from. A broken account is skipped rather than failing the schedule.
async function connectedAccountEvents(userId: string) {
  const accounts = await dbMinimal
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.userId, userId));

  const perAccount = await Promise.all(
    accounts.map(async (account) => {
      if (!account.accessToken && !account.refreshToken) return [];
      // providerAccountId is the account's Google email, saved when it was connected
      const email = account.providerAccountId;
      const fetchWith = (accessToken: string) =>
        googleApiService.getCalendarEvents({ accessToken, refreshToken: account.refreshToken || undefined }, email);
      const refresh = async () => {
        const refreshed = await googleApiService.refreshAccessToken(account.refreshToken!);
        await dbMinimal
          .update(connectedAccounts)
          .set({
            accessToken: refreshed.access_token,
            tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
          } as any)
          .where(eq(connectedAccounts.id, account.id));
        return refreshed.access_token;
      };

      try {
        // Refresh first if the stored token has (nearly) expired, saving a failed request
        const expired =
          !account.accessToken || (account.tokenExpiry !== null && account.tokenExpiry.getTime() < Date.now() + 60_000);
        const accessToken = expired && account.refreshToken ? await refresh() : account.accessToken!;
        let events;
        try {
          events = await fetchWith(accessToken);
        } catch (error) {
          if (!account.refreshToken || expired) throw error;
          events = await fetchWith(await refresh());
        }
        return events.map((event) => ({ ...event, accountId: account.id }));
      } catch (error) {
        console.error(
          `❌ Calendar fetch failed for connected account ${account.id}:`,
          error instanceof Error ? error.message : error,
        );
        return [];
      }
    }),
  );
  return perAccount.flat();
}

// The same meeting can be on more than one account's calendar: show it once
function dedupeEvents<T extends { id: string }>(events: T[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (!event.id) return true;
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

export async function GET(_request: NextRequest) {
  console.log('🔵 CALENDAR ROUTE HIT - Request received at:', new Date().toISOString());
  try {
    const session = await getApiSession();
    console.log('🔵 CALENDAR ROUTE - Auth session:', session?.user?.email);

    if (!session?.user?.id) {
      console.error("❌ Session or user ID missing in GET /api/calendar");
      return NextResponse.json(
        { error: "Unauthorized - No User ID", success: false, data: [] },
        { status: 401 }
      );
    }

    const authUser = session.user;

    let [dbUser] = await dbMinimal
      .select()
      .from(userTable)
      .where(eq(userTable.id, authUser.id))
      .limit(1);

    if (!dbUser) {
      console.log('User not found in DB, creating new user...');
      const newUser = {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.name || authUser.email!,
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        googleId: null,
        lastCalendarSync: null,
        emailVerified: null,
        image: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await dbMinimal.insert(userTable).values(newUser as any);
      dbUser = newUser as any;
      console.log('✅ New user created:', dbUser.email);
    }

    console.log('📅 Calendar API - User:', dbUser.email);

    // Proactively check for tokens - even if DB says disconnected, we'll try to fetch if tokens exist
    // this handles cases where the flag is out of sync but tokens are valid.

    let events: any[] = [];
    let reconnect: ReconnectState | null = null;
    const sessionAccessToken = session.accessToken;
    const sessionRefreshToken = session.refreshToken;

    // Determine which tokens to use (session vs database fallback)
    const accessToken = sessionAccessToken || dbUser.accessToken;
    const refreshToken = sessionRefreshToken || dbUser.refreshToken;

    if (accessToken) {
      console.log(`📅 Use tokens from: ${sessionAccessToken ? 'session' : 'database'}`);
      let currentAccessToken = accessToken;

      try {
        events = await googleApiService.getCalendarEvents(
          { accessToken: currentAccessToken, refreshToken: refreshToken || undefined },
          dbUser.email
        );
        console.log('✅ Fetched', events.length, 'events from all accounts');
        
        // AUTO-HEAL: If we successfully fetched events but DB says disconnected, update it!
        if (dbUser.googleCalendarConnected === false) {
          console.log('🩹 AUTO-HEAL: Successful fetch with healthy tokens. Marking calendar as connected in DB.');
          await dbMinimal
            .update(userTable)
            .set({ googleCalendarConnected: true } as any)
            .where(eq(userTable.id, authUser.id));
        }
      } catch (error) {
        console.error('❌ Calendar fetch error:', error);

        // Try each distinct refresh token we know about (session first, then DB, which
        // may be newer if the user signed in again on another device).
        const refreshCandidates = [...new Set([sessionRefreshToken, dbUser.refreshToken].filter(Boolean))] as string[];
        let refreshError: unknown = null;
        let recovered = false;

        for (const candidate of refreshCandidates) {
          try {
            console.log('🔄 Attempting to refresh access token...');
            const newTokens = await googleApiService.refreshAccessToken(candidate);
            currentAccessToken = newTokens.access_token;

            await dbMinimal
              .update(userTable)
              .set({
                accessToken: newTokens.access_token,
                refreshToken: candidate,
                tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
                googleCalendarConnected: true,
              } as any)
              .where(eq(userTable.id, authUser.id));
            console.log('✅ Token refreshed and saved to database');

            events = await googleApiService.getCalendarEvents(
              { accessToken: currentAccessToken, refreshToken: candidate },
              dbUser.email
            );
            console.log('✅ Fetched', events.length, 'events after token refresh');
            recovered = true;
            break;
          } catch (err) {
            refreshError = err;
          }
        }

        if (!recovered) {
          const reason = refreshError instanceof Error ? refreshError.message : String(refreshError ?? '');
          // Google answers invalid_grant ("Token has been expired or revoked.") when the grant is
          // really gone. Anything else (network, 5xx, rate limits) is transient: don't disconnect.
          const grantRevoked = refreshCandidates.length === 0 || /invalid_grant|expired or revoked/i.test(reason);

          if (!grantRevoked) {
            console.error('⚠️ Calendar fetch failed transiently, keeping connection:', reason);
            return NextResponse.json(
              { success: false, data: [], error: "Couldn't reach Google Calendar. Try again shortly." },
              { status: 503 }
            );
          }

          console.error('❌ Google grant revoked or expired:', reason);
          await dbMinimal
            .update(userTable)
            .set({ googleCalendarConnected: false } as any)
            .where(eq(userTable.id, authUser.id));

          reconnect = {
            reason: "revoked",
            message: "Google paused calendar access. This happens if access was removed in your Google account, your password changed, or it went unused for a while."
          };
        }
      }
    } else {
      console.warn('⚠️ No tokens available (session or DB). Prompting reconnection.');
      reconnect = {
        reason: "not_connected",
        message: "Google Calendar not connected. Please sign in to sync your schedule."
      };
    }

    // Your own calendars, then the Google accounts connected in Settings. Each event says which
    // account it came from (`primary-<userId>` or the connected account's id), so the schedule
    // can hide the accounts switched off in Settings.
    const allEvents = dedupeEvents([
      ...events.map((event) => ({ ...event, accountId: `primary-${authUser.id}` })),
      ...(await connectedAccountEvents(authUser.id)),
    ]);

    if (reconnect) {
      return NextResponse.json({ success: true, data: allEvents, needsReconnection: true, ...reconnect });
    }

    console.log('📤 Returning', allEvents.length, 'total events');
    return NextResponse.json({ success: true, data: allEvents });

  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch calendar", success: false, data: [] },
      { status: 500 }
    );
  }
}
