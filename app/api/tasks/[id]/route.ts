import { NextRequest } from 'next/server'
import { db } from '@/server/db'
import { tasks } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
  
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    })

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    return Response.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
  
  try {
    const body = await request.json()
    const result = await db
      .update(tasks)
      .set(body)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!result.length) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating task:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
  
  try {
    const body = await request.json()
    const result = await db
      .update(tasks)
      .set(body)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!result.length) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    return Response.json(result[0])
  } catch (error) {
    console.error('Error updating task:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await context.params
  
  try {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning()

    if (!result.length) {
      return Response.json({ error: 'Task not found' }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 