import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  try {
    const [{ createClient }, { dbMinimal }, { user: userTable, connectedAccounts }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/shared/schema-tables'),
    ]);

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const [dbUser] = await dbMinimal
      .select()
      .from(userTable)
      .where(eq(userTable.id, authUser.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get connected accounts
    const secondaryAccounts = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, authUser.id));

    return NextResponse.json({
      primaryAccount: {
        email: dbUser.email,
        googleCalendarConnected: dbUser.googleCalendarConnected,
        hasAccessToken: !!dbUser.accessToken,
        accessTokenLength: dbUser.accessToken?.length,
        accessTokenPreview: dbUser.accessToken?.substring(0, 20) + '...',
        hasRefreshToken: !!dbUser.refreshToken,
        refreshTokenLength: dbUser.refreshToken?.length,
        refreshTokenPreview: dbUser.refreshToken?.substring(0, 20) + '...',
        tokenExpiry: dbUser.tokenExpiry,
        lastCalendarSync: dbUser.lastCalendarSync,
      },
      secondaryAccounts: secondaryAccounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        hasAccessToken: !!acc.accessToken,
        accessTokenLength: acc.accessToken?.length,
        hasRefreshToken: !!acc.refreshToken,
        refreshTokenLength: acc.refreshToken?.length,
        tokenExpiry: acc.tokenExpiry,
        createdAt: acc.createdAt,
      })),
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get calendar status" },
      { status: 500 }
    );
  }
}
