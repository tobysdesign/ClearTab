import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connectedAccounts } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";

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

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token) {
      throw new Error("Failed to retrieve access token from Google.");
    }

    oauth2Client.setCredentials({ access_token });
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: userInfo } = await oauth2.userinfo.get();

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
          updatedAt: new Date(),
        })
        .where(eq(connectedAccounts.id, existingLink.id));
    } else {
      // If the link does not exist, insert a new record for the current user.
      await db.insert(connectedAccounts).values({
        userId: primaryUser.id,
        provider: "google",
        providerAccountId: providerAccountId,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry: expiry_date ? new Date(expiry_date) : null,
      });
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error: any) {
    console.error("Error linking secondary account:", error);
    const debugInfo = {
      error_message: error.message || "Failed to link account",
      redirect_uri_used: redirectUri,
    };
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(JSON.stringify(debugInfo))}`,
    );
  }
}
