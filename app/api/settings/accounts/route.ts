import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { connectedAccounts, user as userTable } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { lightweightGoogleApi } from "@/lib/lightweight-google-api";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, user.id));

    // Get email for each account
    const accountsWithEmails = await Promise.all(
      accounts.map(async (account) => {
        try {
          if (!account.accessToken) {
            return { ...account, email: "Unknown" };
          }

          const auth = {
            accessToken: account.accessToken,
            refreshToken: account.refreshToken || undefined,
          };

          const userInfo = await lightweightGoogleApi.getUserInfo(auth);
          return { ...account, email: userInfo.email || "Unknown" };
        } catch (error) {
          console.error(
            `Error fetching email for account ${account.id}:`,
            error,
          );
          return { ...account, email: "Unknown" };
        }
      }),
    );

    return NextResponse.json(accountsWithEmails);
  } catch (error) {
    console.error("Settings accounts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    await db
      .delete(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.id, id),
          eq(connectedAccounts.userId, user.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings accounts API error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
