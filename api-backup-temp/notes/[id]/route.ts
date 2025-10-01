import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { type Note } from '@/shared/schema'
import { createClient } from '@/lib/supabase/server'
// import { shouldProcessUpdate, queueUpdate, getQueuedUpdate } from '@/server/debounced-updates' // Temporarily disabled

export const runtime = 'nodejs'

// Validation schema for update payload
const updateSchema = z.object({
  title: z.string().optional(),
  content: z.array(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const userId = user.id;

  const params = await context.params
  const id = params.id
  if (!id || typeof id !== 'string') {
    return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ success: false, error: 'Note not found' }, { status: 404 });
      }
      console.error('Supabase query error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    return Response.json({ success: true, data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notes/:id - Update a note
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id;

    const params = await context.params
    const id = params.id
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid note ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Temporarily disabled debouncing - always process updates immediately
    // const shouldProcess = await shouldProcessUpdate(id, userId)
    // if (!shouldProcess) {
    //   await queueUpdate(id, userId, validatedData)
    //   return NextResponse.json({ 
    //     success: true, 
    //     data: { ...validatedData, id, queued: true },
    //     message: 'Update queued'
    //   })
    // }

    // const queuedUpdate = await getQueuedUpdate(id, userId)
    const finalData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    }
    
    const { data: result, error } = await supabase
      .from('notes')
      .update(finalData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Note not found' },
          { status: 404 }
        )
      }
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update note' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error updating note:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid note data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const userId = user.id;
  
  const params = await context.params
  const id = params.id
  if (!id || typeof id !== 'string') {
    return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { data: result, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }

    if (!result || result.length === 0) {
      return Response.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 