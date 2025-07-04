import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ActionResponse } from '@/types/actions'
import { db } from '@/server/db'
import { memories, type Memory, insertMemorySchema } from '@/shared/schema'
import { desc, eq } from 'drizzle-orm'

const postBodySchema = insertMemorySchema

export async function GET(
  request: Request
): Promise<NextResponse<ActionResponse<Memory[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '1' // TODO: Get from auth session
    
    const allMemories = await db.query.memories.findMany({
      where: eq(memories.userId, parseInt(userId)),
      orderBy: [desc(memories.updatedAt)]
    })
    
    return NextResponse.json({
      success: true,
      data: allMemories
    })
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch memories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<Memory>>> {
  try {
    const body = await request.json()
    const validatedData = postBodySchema.parse(body)
    
    const newMemory = await db.insert(memories)
      .values({
        ...validatedData,
        userId: 1, // TODO: Get from auth session
        tags: validatedData.tags || [],
      })
      .returning()
    
    return NextResponse.json({ 
      success: true, 
      data: newMemory[0] 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        if (err.path) {
          const path = err.path.join('.')
          validationErrors[path] = [err.message]
        }
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid memory data',
          validationErrors 
        },
        { status: 400 }
      )
    }
    
    console.error('Failed to create memory:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create memory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ActionResponse<Memory>>> {
  try {
    const body = await request.json()
    const validatedData = postBodySchema.partial().parse(body)
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory ID' },
        { status: 400 }
      )
    }
    
    const updatedMemory = await db.update(memories)
      .set({
        ...validatedData,
        tags: validatedData.tags || undefined,
        updatedAt: new Date()
      })
      .where(eq(memories.id, id))
      .returning()
    
    if (!updatedMemory.length) {
      return NextResponse.json(
        { success: false, error: 'Memory not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMemory[0] 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        if (err.path) {
          const path = err.path.join('.')
          validationErrors[path] = [err.message]
        }
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid memory data',
          validationErrors 
        },
        { status: 400 }
      )
    }
    
    console.error('Failed to update memory:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update memory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ActionResponse<void>>> {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid memory ID' },
        { status: 400 }
      )
    }
    
    const deleted = await db.delete(memories)
      .where(eq(memories.id, id))
      .returning()
    
    if (!deleted.length) {
      return NextResponse.json(
        { success: false, error: 'Memory not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete memory:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete memory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 