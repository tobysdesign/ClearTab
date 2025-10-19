import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has calendar connected
    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);

    if (dbUser?.googleCalendarConnected && dbUser.accessToken) {
      return NextResponse.json({ success: true, message: "Calendar already connected" });
    }

    // If no calendar connected, return false to trigger OAuth flow
    return NextResponse.json({
      success: false,
      message: "Calendar not connected, OAuth flow required"
    });
  } catch (error) {
    console.error("Connect calendar error:", error);
    return NextResponse.json(
      { error: "Failed to connect calendar" },
      { status: 500 }
    );
  }
}