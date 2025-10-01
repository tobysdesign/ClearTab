import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { connectedAccounts } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';

// This endpoint forces a check on a linked account to see if its tokens are still valid.
// If tokens are invalid (e.g., user revoked access in Google), it deletes the stale connection.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerAccountId } = await request.json();
    if (!providerAccountId) {
      return NextResponse.json({ error: 'providerAccountId is required' }, { status: 400 });
    }

    // Find the stale connection in our database.
    const [staleLink] = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.providerAccountId, providerAccountId))
      .limit(1);

    if (!staleLink) {
      return NextResponse.json({ success: true, message: 'Account not found or already removed.' });
    }

    // If the link belongs to the current user, they should use the normal disconnect flow.
    if (staleLink.userId === user.id) {
        return NextResponse.json({ error: 'This is your own linked account. Please disconnect it directly.' }, { status: 400 });
    }

    // Attempt to use the stored tokens to see if they are still valid.
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: staleLink.accessToken,
      refresh_token: staleLink.refreshToken,
    });

    try {
      // Make a lightweight API call to Google to check the token validity.
      await oauth2Client.getTokenInfo(staleLink.accessToken!);
      // If this call succeeds, the token is still valid and the user has not revoked access.
      return NextResponse.json({ error: 'This account connection is still active. The owner must revoke permissions from their Google Account settings.' }, { status: 400 });
    } catch (error: any) {
      // If the error is 'invalid_grant' or similar, it means the user has revoked access.
      if (error.response?.data?.error === 'invalid_grant' || error.message.includes('invalid_token')) {
        // The token is invalid, so we can safely delete the stale connection.
        await db.delete(connectedAccounts).where(eq(connectedAccounts.id, staleLink.id));
        return NextResponse.json({ success: true, message: 'Stale connection successfully removed.' });
      } else {
        // Re-throw other unexpected errors.
        throw error;
      }
    }

  } catch (error: any) {
    console.error("Force revoke check error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to check account status' },
      { status: 500 },
    );
  }
}
