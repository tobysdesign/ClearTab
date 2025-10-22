import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dbMinimal } from '@/lib/db-minimal';
import { connectedAccounts } from '@/shared/schema-tables';
import { eq } from 'drizzle-orm';
// Remove googleapis dependency - replaced with direct API calls

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
    const [staleLink] = await dbMinimal
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
    // Make a lightweight API call to Google to check the token validity.
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `access_token=${staleLink.accessToken}`,
      });

      if (response.ok) {
        // If this call succeeds, the token is still valid and the user has not revoked access.
        return NextResponse.json({
          error: 'This account connection is still active. The owner must revoke permissions from their Google Account settings.'
        }, { status: 400 });
      } else {
        // Token is invalid, we can safely delete the stale connection.
        await dbMinimal.delete(connectedAccounts).where(eq(connectedAccounts.id, staleLink.id));
        return NextResponse.json({ success: true, message: 'Stale connection successfully removed.' });
      }
    } catch {
      // If there's a network error or other issue, assume token is invalid
      await dbMinimal.delete(connectedAccounts).where(eq(connectedAccounts.id, staleLink.id));
      return NextResponse.json({ success: true, message: 'Stale connection successfully removed.' });
    }

  } catch (error) {
    console.error("Force revoke check error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to check account status' },
      { status: 500 },
    );
  }
}
