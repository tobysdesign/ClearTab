import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Check if user exists in the user table
    const { data: existingUser, error: fetchError } = await supabase
      .from('user')
      .select('id, email, google_calendar_connected')
      .eq('id', authUser.id)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking user:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    if (!existingUser) {
      // Create user record
      const { error: insertError } = await supabase
        .from('user')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          google_calendar_connected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('Error creating user:', insertError)
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        created: true,
        user: { id: authUser.id, email: authUser.email, google_calendar_connected: false }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      created: false,
      user: existingUser
    })
    
  } catch (error) {
    console.error('Ensure user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}