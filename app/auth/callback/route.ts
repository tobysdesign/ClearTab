import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback - Code:', code ? 'present' : 'missing')
  
  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Exchange result:', { 
        success: !error, 
        error: error?.message,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasProviderToken: !!data?.session?.provider_token,
        hasProviderRefreshToken: !!data?.session?.provider_refresh_token,
        provider: data?.user?.app_metadata?.provider
      })
      
      // If we have provider tokens, ensure they're stored
      if (!error && data?.session?.provider_token && data?.user) {
        console.log('Auth callback: Storing provider tokens in database');
        try {
          const { error: dbError } = await supabase
            .from('user')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
              google_id: data.user.user_metadata?.provider_id,
              google_calendar_connected: true,
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });
          
          if (dbError) {
            console.error('Failed to store tokens in database:', dbError);
          } else {
            console.log('Successfully stored provider tokens in database');
          }
        } catch (dbStoreError) {
          console.error('Error storing tokens:', dbStoreError);
        }
      }
      
      if (!error && data?.session) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Auth exchange failed:', error?.message)
      }
    } catch (err) {
      console.error('Auth callback error:', err)
    }
  }

  // Return to login on any error
  return NextResponse.redirect(`${origin}/login`)
}