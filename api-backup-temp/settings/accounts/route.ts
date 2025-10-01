import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/server/db'
import { connectedAccounts } from '@/shared/schema'
import { eq } from 'drizzle-orm'
import { getGoogleOAuth2Client } from '@/server/google-calendar'
import { google } from 'googleapis'
import type { ConnectedAccountWithEmail } from '@/shared/types'

export type { ConnectedAccountWithEmail } from '@/shared/types'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const accounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, userId))

    const accountsWithEmail: ConnectedAccountWithEmail[] = []

    for (const account of accounts) {
      const oauth2Client = getGoogleOAuth2Client(account.accessToken || '', account.refreshToken || '')
      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
        expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : null,
      })

      // Refresh token if needed
      if (
        !oauth2Client.credentials.access_token ||
        (oauth2Client.credentials.expiry_date &&
          oauth2Client.credentials.expiry_date < Date.now())
      ) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken()
          oauth2Client.setCredentials(credentials)
          // Update the stored credentials
          // TODO: Fix field names for connectedAccounts update
          // if (credentials.access_token) {
          //   await db
          //     .update(connectedAccounts)
          //     .set({
          //       accessToken: credentials.access_token,
          //       refreshToken: credentials.refresh_token ?? undefined,
          //       tokenExpiry: credentials.expiry_date
          //         ? new Date(credentials.expiry_date)
          //         : null,
          //     })
          //     .where(eq(connectedAccounts.id, account.id))
          // }
        } catch (error) {
          console.error('Error refreshing token, skipping account:', account.id, error)
          continue // Skip this account if token refresh fails
        }
      }

      try {
        const oauth2 = google.oauth2({
          auth: oauth2Client,
          version: 'v2',
        })
        const { data: userInfo } = await oauth2.userinfo.get()
        if (userInfo.email && userInfo.id) {
          accountsWithEmail.push({
            id: account.id,
            provider: account.provider,
            email: userInfo.email,
          })
        }
      } catch (error) {
        console.error('Error fetching user info for account:', account.id, error)
        // Still add account, but maybe with a note that it's unverified
        accountsWithEmail.push({
          id: account.id,
          provider: account.provider,
          email: `Could not retrieve email for this account.`,
        })
      }
    }

    return NextResponse.json(accountsWithEmail)
  } catch (error) {
    console.error('Error fetching connected accounts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, providerAccountId, accessToken, refreshToken, tokenExpiry } = body

    if (!provider || !providerAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert new connected account
    const accountData = {
      userId: user.id,
      provider,
      providerAccountId,
      ...(accessToken && { accessToken }),
      ...(refreshToken && { refreshToken }),
      ...(tokenExpiry && { tokenExpiry: new Date(tokenExpiry) }),
    }
    
    const newAccount = await db
      .insert(connectedAccounts)
      .values(accountData)
      .returning()

    return NextResponse.json({ success: true, account: newAccount[0] })
  } catch (error) {
    console.error('Error adding connected account:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Delete the connected account (only if it belongs to the current user)
    await db
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing connected account:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 