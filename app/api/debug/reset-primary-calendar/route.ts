import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(_request: NextRequest) {
  try {
    const [{ createClient }, { dbMinimal }, { user: userTable }] = await Promise.all([
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

    console.log(`🧹 Resetting primary calendar for user: ${authUser.email} (${authUser.id})`);

    // Clear all calendar-related tokens
    await dbMinimal
      .update(userTable)
      .set({
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      } as any)
      .where(eq(userTable.id, authUser.id));

    console.log('✅ Primary calendar tokens cleared successfully!');

    return NextResponse.json({
      success: true,
      message: 'Primary calendar reset successfully. Refresh the page to trigger OAuth.',
      userId: authUser.id,
      email: authUser.email,
    });
  } catch (error) {
    console.error("Reset primary calendar error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset calendar" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const [{ createClient }, { dbMinimal }, { user: userTable }] = await Promise.all([
      import('@/lib/supabase/server'),
      import('@/lib/db-minimal'),
      import('@/shared/schema-tables'),
    ]);

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized - Please log in first" }, { status: 401 });
    }

    console.log(`🧹 Resetting primary calendar for user: ${authUser.email} (${authUser.id})`);

    // Clear all calendar-related tokens
    await dbMinimal
      .update(userTable)
      .set({
        googleCalendarConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      } as any)
      .where(eq(userTable.id, authUser.id));

    console.log('✅ Primary calendar tokens cleared successfully!');

    // Redirect to home with a message
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/?calendar_reset=true`);
  } catch (error) {
    console.error("Reset primary calendar error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset calendar" },
      { status: 500 }
    );
  }
}
