import { NextResponse } from 'next/server'
import { z } from 'zod'
import { type Note, BlockNoteContentSchema, EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema'
import { ActionResponse } from '@/types/actions'
import { createClient } from '@/lib/supabase/server'
import { getStoredSession, getSessionId } from '@/lib/session-store'

const postBodySchema = z.object({
  title: z.string().default('Untitled Note'),
  content: BlockNoteContentSchema.optional().default(EMPTY_BLOCKNOTE_CONTENT),
})

export async function GET(request: Request): Promise<NextResponse<ActionResponse<Note[]>>> {
  const supabase = await createClient()
  
  // Try session-based auth first
  const sessionId = getSessionId(request)
  let userId: string
  
  if (sessionId) {
    // Get stored session (fast path)
    const storedAuth = getStoredSession(sessionId)
    
    if (storedAuth) {
      userId = storedAuth.user.id
    } else {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 401 }
      );
    }
  } else {
    // Fallback to Supabase auth (slower, but works during transition)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    userId = user.id
  }

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      // If permission denied, return empty array (table doesn't exist yet)
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return NextResponse.json({ success: true, data: [] })
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes', details: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'An unknown error occurred while fetching notes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<Note>>> {
  const supabase = await createClient()
  
  // Use the same hybrid auth as GET
  const sessionId = getSessionId(request)
  let userId: string
  
  if (sessionId) {
    const storedAuth = getStoredSession(sessionId)
    if (storedAuth) {
      userId = storedAuth.user.id
    } else {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 401 }
      );
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }
    userId = user.id
  }

  try {
    const body = await request.json()
    const validatedData = postBodySchema.parse(body);

    // Explicitly construct the object for insertion to ensure correct types
    const noteToInsert = {
      id: crypto.randomUUID(), // Generate UUID for primary key
      title: validatedData.title,
      content: validatedData.content || EMPTY_BLOCKNOTE_CONTENT,
      user_id: userId, // Use snake_case to match database
    };

    const { data: result, error } = await supabase
      .from('notes')
      .insert(noteToInsert)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create note', details: error.message },
        { status: 500 }
      )
    }
    

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        if (!validationErrors[path]) {
          validationErrors[path] = []
        }
        validationErrors[path].push(err.message)
      })
      
      console.error('Failed to create note - Validation Error:', JSON.stringify(validationErrors, null, 2))
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid note data',
          validationErrors 
        },
        { status: 400 }
      )
    }
    
    console.error('Failed to create note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request
): Promise<NextResponse<ActionResponse<Note>>> {
  const supabase = await createClient()
  
  // Use the same hybrid auth as GET
  const sessionId = getSessionId(request)
  let userId: string
  
  if (sessionId) {
    const storedAuth = getStoredSession(sessionId)
    if (storedAuth) {
      userId = storedAuth.user.id
    } else {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 401 }
      );
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }
    userId = user.id
  }

  try {
    const body = await request.json()
    const { noteId, ...updateData } = body
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID required for update' },
        { status: 400 }
      )
    }

    // Direct update - client-side debouncing handles rate limiting
    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update({
        title: updateData.title,
        content: updateData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update note', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedNote })
  } catch (error) {
    console.error('Failed to update note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    )
  }
} 