import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from "@/auth";
import { dbMinimal } from "@/lib/db-minimal";
import { user as userTable, connectedAccounts } from "@/shared/schema-tables";
import { googleApiService } from "@/lib/google-api-service";
import type { ConnectedAccountWithEmail } from '@/shared/types';

export async function GET(_request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string | null = null;

    if (devBypass) {
      console.log('🔧 Development mode: Bypassing auth for accounts API');
      userId = '00000000-0000-4000-8000-000000000000';
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        console.error("❌ Session or user ID missing in GET /api/settings/accounts");
        return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
      }

      userId = session.user.id;
    }

    // Fetch connected accounts from database
    const accounts = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, userId));

    // Enhance accounts with email information
    const accountsWithEmail: ConnectedAccountWithEmail[] = [];

    for (const account of accounts) {
      if (!account.accessToken) continue;

      try {
        const authInfo = {
          accessToken: account.accessToken,
          refreshToken: account.refreshToken || undefined,
        };

        const email = await googleApiService.getUserInfo(authInfo);
        accountsWithEmail.push({
          ...account,
          email,
        });
      } catch (error) {
        console.error(`Failed to get email for account ${account.id}:`, error);
        // Include account even without email
        accountsWithEmail.push({
          ...account,
          email: 'Unknown',
        });
      }
    }

    return NextResponse.json(accountsWithEmail);
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch connected accounts'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: 'Account ID is required'
      }, { status: 400 });
    }

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let userId: string | null = null;

    if (devBypass) {
      console.log('🔧 Development mode: Bypassing auth for account deletion');
      userId = '00000000-0000-4000-8000-000000000000';
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        console.error("❌ Session or user ID missing in DELETE /api/settings/accounts");
        return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
      }

      userId = session.user.id;
    }

    // Verify the account belongs to the current user before deleting
    const [existingAccount] = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId))
      .limit(1);

    if (!existingAccount) {
      return NextResponse.json({
        success: false,
        error: 'Account not found'
      }, { status: 404 });
    }

    if (existingAccount.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized to delete this account'
      }, { status: 403 });
    }

    // Delete the account
    await dbMinimal
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId));

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Error removing account:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove account'
    }, { status: 500 });
  }
}