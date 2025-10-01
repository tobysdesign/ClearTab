import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!authUser || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('Connect calendar - session info:', {
      userId: authUser.id,
      hasProviderToken: !!session.provider_token,
      hasRefreshToken: !!session.provider_refresh_token,
      provider: authUser.app_metadata?.provider
    })
    
    // Use Supabase client instead of direct database connection
    const { error: updateError } = await supabase
      .from('user')
      .update({
        google_calendar_connected: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id)
    
    if (updateError) {
      console.error('Failed to update user calendar status:', updateError)
      return NextResponse.json({ error: 'Failed to update calendar status' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Calendar connection marked as active',
      debug: {
        hasProviderToken: !!session.provider_token,
        provider: authUser.app_metadata?.provider
      }
    })
  } catch (error) {
    console.error('Connect calendar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}