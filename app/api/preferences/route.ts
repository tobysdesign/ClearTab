import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api-session";
import { dbMinimal } from "@/lib/db-minimal";
import { userPreferences } from "@/shared/schema-tables";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Development bypass for testing
    const devBypass =
      process.env.DEV_BYPASS_AUTH === "true" &&
      process.env.NODE_ENV === "development";
    const defaultUserId = "00000000-0000-4000-8000-000000000000";

    let userId = defaultUserId;

    if (!devBypass) {
      const session = await getApiSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const [prefs] = await dbMinimal
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    console.log(
      "📖 GET preferences for user:",
      userId,
      prefs?.countdownTitle,
      prefs?.endDate ? "has end date" : "no end date",
    );
    return NextResponse.json({ data: prefs || {} });
  } catch (error) {
    console.error("❌ Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass =
      process.env.DEV_BYPASS_AUTH === "true" &&
      process.env.NODE_ENV === "development";
    const defaultUserId = "00000000-0000-4000-8000-000000000000";

    let userId = defaultUserId;

    if (!devBypass) {
      const session = await getApiSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const body = await request.json();
    console.log("🔍 API saving for user:", userId.slice(0, 8));

    // Convert ISO string dates back to Date objects for database. The row's identity comes
    // from the session only: a body userId must never pick whose preferences are written.
    const { id: _id, userId: _userId, createdAt: _createdAt, ...processedBody } = body ?? {};
    if (processedBody.startDate && typeof processedBody.startDate === "string") {
      processedBody.startDate = new Date(processedBody.startDate);
    }
    if (processedBody.endDate && typeof processedBody.endDate === "string") {
      processedBody.endDate = new Date(processedBody.endDate);
    }
    if (
      processedBody.paydayDate &&
      typeof processedBody.paydayDate === "string"
    ) {
      processedBody.paydayDate = new Date(processedBody.paydayDate);
    }

    // Upsert user preferences
    const [updated] = await dbMinimal
      .insert(userPreferences)
      .values({
        userId: userId,
        ...processedBody,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: processedBody,
      })
      .returning();

    console.log('✅ Database updated:', updated);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
