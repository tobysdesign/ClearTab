import { NextRequest, NextResponse } from 'next/server'
import { type Task, BlockNoteContentSchema } from '@/shared/schema'
import { z } from 'zod'
import { ActionResponse } from '@/types/actions'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
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
  
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const patchBodySchema = z.object({
  title: z.string().optional(),
  content: BlockNoteContentSchema.optional(),
  isCompleted: z.boolean().optional(),
  isHighPriority: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().optional()
}).partial();

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
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
  
  try {
    const body = await request.json()
    const validatedData = patchBodySchema.parse(body)
    
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.isCompleted !== undefined) updateData.is_completed = validatedData.isCompleted;
    if (validatedData.isHighPriority !== undefined) updateData.is_high_priority = validatedData.isHighPriority;
    if (validatedData.dueDate !== undefined) {
      updateData.due_date = validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null;
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedTask })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
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
  
  try {
    const body = await request.json()
    const validatedData = patchBodySchema.parse(body)
    
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.isCompleted !== undefined) updateData.is_completed = validatedData.isCompleted;
    if (validatedData.isHighPriority !== undefined) updateData.is_high_priority = validatedData.isHighPriority;
    if (validatedData.dueDate !== undefined) {
      updateData.due_date = validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null;
    }
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedTask })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
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
  
  try {
    const { data: deleted, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 