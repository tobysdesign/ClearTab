import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { tasks, type Task } from '@/shared/schema';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { ActionResponse } from '@/types/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const postBodySchema = z.object({
  title: z.string(),
  description: z.record(z.any()).optional(),
  status: z.enum(['pending', 'completed', 'important']).default('pending'),
  dueDate: z.string().datetime().optional(),
  order: z.number().optional()
});

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
    body.userId = userId;
    const result = await db
      .insert(tasks)
      .values(body)
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
    console.error('Failed to create task:', error);
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
  try {
    const body = await request.json();
    const validatedData = postBodySchema.partial().parse(body);
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const updatedTask = await db.update(tasks)
      .set({
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
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
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
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