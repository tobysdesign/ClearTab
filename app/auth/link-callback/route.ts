import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connectedAccounts } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { lightweightGoogleApi } from "@/lib/lightweight-google-api";

// This route is specifically for linking secondary accounts.
// It avoids the main /auth/callback to prevent conflicts with Supabase's client-side auth handler.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    const errorInfo = { message: "Authorization code not found." };
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(JSON.stringify(errorInfo))}`,
    );
  }

  const redirectUri = `${origin}/auth/link-callback`;

  try {
    const supabase = await createClient();
    const {
      data: { user: primaryUser },
    } = await supabase.auth.getUser();

    if (!primaryUser) {
      throw new Error("User not authenticated. Please sign in again.");
    }

    const tokens = await lightweightGoogleApi.exchangeCodeForTokens(code, redirectUri);
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
      throw new Error("Failed to retrieve access token from Google.");
    }

    // Calculate expiry date from expires_in seconds
    const expiry_date = expires_in ? Date.now() + (expires_in * 1000) : null;

    const userEmail = await lightweightGoogleApi.getUserInfo({ accessToken: access_token });

    // For Google API, we need to make a separate request to get the user ID
    // This is a simplified approach - in production you might want to cache this
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to retrieve user info from Google.");
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.id) {
      throw new Error("Failed to retrieve user info from Google.");
    }

    const providerAccountId = userInfo.id;

    // Check if this Google account is already linked to any user in the system.
    const [existingLink] = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.providerAccountId, providerAccountId))
      .limit(1);

    if (existingLink) {
      // If the link exists and belongs to a DIFFERENT user, redirect with an error.
      if (existingLink.userId !== primaryUser.id) {
        const debugInfo = {
          error_message:
            "This Google account is already linked to another user.",
          providerAccountId: providerAccountId,
        };
        return NextResponse.redirect(
          `${origin}/settings?error=${encodeURIComponent(JSON.stringify(debugInfo))}`,
        );
      }

      // If it belongs to the CURRENT user, they are just re-linking. Update their tokens.
      await db
        .update(connectedAccounts)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token || existingLink.refreshToken,
          tokenExpiry: expiry_date ? new Date(expiry_date) : null,
        } as any)
        .where(eq(connectedAccounts.id, existingLink.id));
    } else {
      // If the link does not exist, insert a new record for the current user.
      const insertValues = {
        userId: primaryUser.id,
        provider: "google",
        providerAccountId: providerAccountId,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry: expiry_date ? new Date(expiry_date) : null,
      };

      await db.insert(connectedAccounts).values(insertValues);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error: unknown) {
    console.error("Error linking secondary account:", error);
    const debugInfo = {
      error_message: error instanceof Error ? error.message : "Failed to link account",
      redirect_uri_used: redirectUri,
    };
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(JSON.stringify(debugInfo))}`,
    );
  }
}
