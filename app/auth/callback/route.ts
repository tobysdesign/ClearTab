import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/shared/schema";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Note: addingAccount functionality may be implemented in the future
  // const addingAccount = searchParams.get("adding_account") === "true";

  if (!code) {
    console.error("Auth callback: No code provided.");
    return NextResponse.redirect(`${origin}/login?error=No code provided`);
  }

  const supabase = await createClient();

  // --- Primary Sign-In Flow ---
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error("Auth exchange failed:", error?.message);
      return NextResponse.redirect(
        `${origin}/login?error=Authentication failed`,
      );
    }

    if (data.user) {
      const userInsertValues = {
        email: data.user.email!,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          "User",
        googleId: data.user.user_metadata?.provider_id,
        googleCalendarConnected: !!data.session.provider_token,
        accessToken: data.session.provider_token || null,
        refreshToken: data.session.provider_refresh_token || null,
      } as const;

      await db
        .insert(userTable)
        .values(userInsertValues)
        .onConflictDoUpdate({
          target: userTable.id,
          set: userInsertValues,
        });
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=An unexpected error occurred`,
    );
  }
}
