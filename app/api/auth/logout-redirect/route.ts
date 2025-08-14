import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Sign out the user
    await supabase.auth.signOut()
    
    // Force redirect to login
    return NextResponse.redirect(new URL('/login', 'http://localhost:3000'))
  } catch (error) {
    console.error('Logout redirect error:', error)
    // Even on error, redirect to login
    return NextResponse.redirect(new URL('/login', 'http://localhost:3000'))
  }
}