import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { connectedAccounts, user as userTable } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const addingAccount = searchParams.get("adding_account") === "true";

  console.log(
    "Auth callback - Code:",
    code ? "present" : "missing",
    "Adding account:",
    addingAccount,
  );

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("Exchange result:", {
        success: !error,
        error: error?.message,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasProviderToken: !!data?.session?.provider_token,
        hasProviderRefreshToken: !!data?.session?.provider_refresh_token,
        provider: data?.user?.app_metadata?.provider,
        addingAccount,
      });

      // If we have provider tokens, store them appropriately
      if (!error && data?.session?.provider_token && data?.user) {
        console.log("Auth callback: Storing provider tokens");

        try {
          // Store in connected_accounts if this is a secondary account
          if (addingAccount) {
            console.log("Adding secondary account to connected_accounts table");

            try {
              // Check if this account already exists
              const existingAccount = await db
                .select()
                .from(connectedAccounts)
                .where(
                  and(
                    eq(connectedAccounts.userId, data.user.id),
                    eq(
                      connectedAccounts.providerAccountId,
                      data.user.user_metadata?.provider_id || data.user.id,
                    ),
                  ),
                )
                .limit(1);

              if (existingAccount.length === 0) {
                await db.insert(connectedAccounts).values({
                  userId: data.user.id,
                  provider: "google",
                  providerAccountId:
                    data.user.user_metadata?.provider_id || data.user.id,
                  accessToken: data.session.provider_token,
                  refreshToken: data.session.provider_refresh_token || null,
                  tokenExpiry: data.session.expires_at
                    ? new Date(data.session.expires_at * 1000)
                    : null,
                });
                console.log("Successfully added account to connected_accounts");
              } else {
                // Update existing account tokens
                await db
                  .update(connectedAccounts)
                  .set({
                    accessToken: data.session.provider_token,
                    refreshToken: data.session.provider_refresh_token || null,
                    tokenExpiry: data.session.expires_at
                      ? new Date(data.session.expires_at * 1000)
                      : null,
                    updatedAt: new Date(),
                  })
                  .where(eq(connectedAccounts.id, existingAccount[0].id));
                console.log(
                  "Successfully updated account in connected_accounts",
                );
              }
            } catch (connectedError) {
              console.error(
                "Error managing connected_accounts:",
                connectedError,
              );
            }
          }

          // Always update primary user table
          const { error: dbError } = await supabase.from("user").upsert(
            {
              id: data.user.id,
              email: data.user.email!,
              name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                "User",
              google_id: data.user.user_metadata?.provider_id,
              google_calendar_connected: true,
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "id",
            },
          );

          if (dbError) {
            console.error("Failed to store tokens in user table:", dbError);
          } else {
            console.log("Successfully stored provider tokens in user table");
          }
        } catch (dbStoreError) {
          console.error("Error storing tokens:", dbStoreError);
        }
      }

      if (!error && data?.session) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error("Auth exchange failed:", error?.message);
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  // Return to login on any error
  return NextResponse.redirect(`${origin}/login`);
}
