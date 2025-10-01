import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get both user and session for more info
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get the user from our database using Supabase client
    const { data: dbUser, error: dbError } = await supabase
      .from('user')
      .select('id, email, google_calendar_connected, access_token, refresh_token, created_at, updated_at')
      .eq('id', authUser.id)
      .single()
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database query error:', dbError)
    }
    
    return NextResponse.json({
      supabaseUser: {
        id: authUser.id,
        email: authUser.email,
        provider: authUser.app_metadata?.provider,
        hasProviderToken: !!authUser.app_metadata?.provider_token,
      },
      session: {
        hasProviderToken: !!session?.provider_token,
        hasProviderRefreshToken: !!session?.provider_refresh_token,
        provider: session?.user?.app_metadata?.provider,
      },
      dbUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        googleCalendarConnected: dbUser.google_calendar_connected,
        hasAccessToken: !!dbUser.access_token,
        hasRefreshToken: !!dbUser.refresh_token,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at,
      } : null,
      dbError: dbError?.message || null
    })
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}