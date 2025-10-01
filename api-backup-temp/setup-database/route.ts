import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  console.log("Database setup: Starting")
  
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
    
    console.log("Database setup: User authenticated:", user.email)
    
    // Try to create a simple note to test table access
    const testNote = {
      title: 'Test Note',
      content: [
        {
          id: "default-paragraph",
          type: "paragraph",
          content: [],
          props: {},
        }
      ],
      user_id: user.id
    }
    
    const { data: insertResult, error: insertError } = await supabase
      .from('notes')
      .insert(testNote)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Database table access error',
        details: insertError.message,
        code: insertError.code
      })
    }
    
    console.log("Database setup: Test note created successfully")
    
    // Clean up test note
    await supabase
      .from('notes')
      .delete()
      .eq('id', insertResult.id)
    
    return NextResponse.json({
      success: true,
      message: 'Database is accessible and tables exist'
    })
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}