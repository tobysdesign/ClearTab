import { NextResponse } from 'next/server';
import { type Task, BlockNoteContentSchema, EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';
import { createClient } from '@/lib/supabase/server';

const postBodySchema = z.object({
  title: z.string(),
  content: BlockNoteContentSchema.optional(), // Make content optional with default
  isCompleted: z.boolean().default(false),
  isHighPriority: z.boolean().default(false),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().optional()
});

const patchBodySchema = postBodySchema.partial();

export const runtime = 'nodejs'; // Use Node.js runtime

export async function GET(): Promise<NextResponse<ActionResponse<Task[]>>> {
  // Skip slow auth check - use hardcoded user ID for development
  const userId = 'f4cb8d10-fab0-4477-bfbf-04af508fd2d7'
  
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase query error:', error);
      
      // If permission denied, return empty array (table doesn't exist yet)
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log("Permission denied accessing tasks table, returning empty array");
        return NextResponse.json({ success: true, data: [] })
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }
    
    
    // Transform snake_case to camelCase for frontend
    const transformedData = data?.map(task => ({
      ...task,
      isHighPriority: task.is_high_priority,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      userId: task.user_id,
      isCompleted: task.is_completed
    })) || [];
    
    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<Task>>> {
  // Skip slow auth check - use hardcoded user ID for development
  const userId = 'f4cb8d10-fab0-4477-bfbf-04af508fd2d7'
  
  const supabase = await createClient()

  try {
    const body = await request.json();
    const validatedData = postBodySchema.parse(body);


    const taskToInsert = {
      id: crypto.randomUUID(), // Generate UUID for primary key
      title: validatedData.title,
      content: validatedData.content || EMPTY_BLOCKNOTE_CONTENT,
      is_completed: validatedData.isCompleted ?? false,
      is_high_priority: validatedData.isHighPriority ?? false,
      due_date: validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null,
      order: validatedData.order ?? null,
      user_id: userId, // Use snake_case to match database
    };

    const { data: result, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(err.message);
      });
      return NextResponse.json(
        { success: false, error: 'Invalid task data', validationErrors },
        { status: 400 }
      );
    }
    console.error('Failed to create task:', error); // Log the full error object
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

 