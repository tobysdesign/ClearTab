import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, type Task, BlockNoteContentSchema } from '@/shared/schema';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { ActionResponse } from '@/types/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const postBodySchema = z.object({
  title: z.string(),
  content: BlockNoteContentSchema, // Use the correct BlockNoteContent schema
  isCompleted: z.boolean().default(false), // Changed to required, as it's notNull() in schema
  priority: z.enum(['none', 'low', 'medium', 'high']).default('none'), // Changed to required, as it's notNull() in schema
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().optional()
});

const patchBodySchema = postBodySchema.partial();

export const runtime = 'nodejs'; // Use Node.js runtime

export async function GET(): Promise<NextResponse<ActionResponse<Task[]>>> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  try {
    const data = await db.select().from(tasks).where(eq(tasks.userId, userId));
    console.log("Fetched tasks for user: ", userId, ", data: ", data); // Add logging
    return NextResponse.json({ success: true, data });
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
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = postBodySchema.parse(body);

    console.log("API: Validated data for task creation:", validatedData); // New log

    const result = await db
      .insert(tasks)
      .values({
        title: validatedData.title, // Explicitly set title
        content: validatedData.content || null, 
        isCompleted: validatedData.isCompleted ?? false, 
        priority: validatedData.priority ?? 'none', 
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        order: validatedData.order ?? null, // Explicitly set order (nullable)
        userId: userId, // Explicitly set userId
      })
      .returning();
    return NextResponse.json({ success: true, data: result[0] });
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ActionResponse<Task>>> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();
    const validatedData = patchBodySchema.parse(body);
    const id = params.id; // Use string id from params
    
    // Validate UUID format for id
    if (!id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }
    
    const updatedTask = await db.update(tasks)
      .set({
        ...validatedData,
        content: validatedData.content ?? undefined, // Handle optional content
        isCompleted: validatedData.isCompleted ?? undefined, // Handle optional isCompleted
        priority: validatedData.priority ?? undefined, // Handle optional priority
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : (validatedData.dueDate === null ? null : undefined),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (!updatedTask.length) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedTask[0] 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: Record<string, string[]> = {};
      error.errors.forEach(err => {
        if (err.path) {
          const path = err.path.join('.');
          validationErrors[path] = [err.message];
        }
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid task data',
          validationErrors 
        },
        { status: 400 }
      );
    }
    
    console.error('Failed to update task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ActionResponse<void>>> {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  try {
    const id = params.id;
    
    // Validate UUID format for id
    if (!id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const deleted = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    if (!deleted.length) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
} 