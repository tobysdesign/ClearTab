import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log("Database test: Starting")
  
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    console.log("Database test: User authenticated:", user.email, "ID:", user.id)
    
    // Check if user exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log("Profile check:", { profileData, profileError })
    
    // Check if user exists in user table
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log("User table check:", { userData, userError })
    
    // First, let's try to create a user record if it doesn't exist
    if (!userData && !userError?.message.includes('permission denied')) {
      const { data: insertUser, error: insertUserError } = await supabase
        .from('user')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          google_id: user.user_metadata?.provider_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      console.log("User insert result:", { insertUser, insertUserError })
    }
    
    // Try to create a test note
    const testNote = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: 'Test Note - ' + new Date().toLocaleTimeString(),
      content: [{ id: "test", type: "paragraph", content: [{ type: "text", text: "This is a test note" }], props: {} }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: insertNoteData, error: insertNoteError } = await supabase
      .from('notes')
      .insert(testNote)
      .select()
      .single()
    
    console.log("Note insert result:", { insertNoteData, insertNoteError })
    
    // Try to query notes
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)
    
    console.log("Notes query result:", { notesData, notesError })
    
    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        userEmail: user.email,
        profileExists: !!profileData,
        userTableExists: !!userData,
        notesCount: notesData?.length || 0,
        profileError: profileError?.message,
        userError: userError?.message,
        notesError: notesError?.message
      }
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}