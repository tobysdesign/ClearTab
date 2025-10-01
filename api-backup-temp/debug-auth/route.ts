import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        userError: userError?.message
      })
    }

    // Get user record from database
    const { data: userData, error: dbError } = await supabase
      .from('user')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    return NextResponse.json({
      success: true,
      debug: {
        // Auth user info
        authUser: {
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        },
        
        // Session info
        session: {
          hasSession: !!session,
          provider_token: session?.provider_token ? 'present' : 'missing',
          provider_refresh_token: session?.provider_refresh_token ? 'present' : 'missing',
          expires_at: session?.expires_at,
          user_id: session?.user?.id
        },
        
        // Database user record
        dbUser: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          google_id: userData.google_id,
          google_calendar_connected: userData.google_calendar_connected,
          access_token: userData.access_token ? 'present' : 'missing',
          refresh_token: userData.refresh_token ? 'present' : 'missing',
          token_expiry: userData.token_expiry,
          last_calendar_sync: userData.last_calendar_sync,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        } : null,
        
        dbError: dbError?.message
      }
    })
    
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    
    if (action !== 'reset-calendar') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Reset calendar connection state
    const { error: updateError } = await supabase
      .from('user')
      .update({
        google_calendar_connected: false,
        access_token: null,
        refresh_token: null,
        token_expiry: null,
        last_calendar_sync: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to reset calendar connection',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar connection reset successfully'
    })
    
  } catch (error) {
    console.error('Debug auth POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}