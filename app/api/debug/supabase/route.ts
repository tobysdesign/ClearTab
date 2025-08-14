import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Debug cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.includes('supabase') || cookie.name.includes('sb-')
    )
    
    console.log('All cookies count:', allCookies.length)
    console.log('Supabase cookies:', supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    const supabase = await createClient()
    console.log('Supabase client created')
    
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    
    console.log('Auth check result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      error: userError?.message 
    })
    
    return NextResponse.json({
      message: 'Supabase test working',
      auth: {
        authenticated: !!user,
        userEmail: user?.email || null,
        userId: user?.id || null,
        error: userError?.message || null
      },
      debug: {
        totalCookies: allCookies.length,
        supabaseCookies: supabaseCookies.length,
        cookieNames: supabaseCookies.map(c => c.name)
      }
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Supabase test failed',
      details: errorMessage
    }, { status: 500 })
  }
}