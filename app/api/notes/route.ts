import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notes, type Note } from '@/shared/schema'
import { db } from '@/server/db'
import { desc, eq } from 'drizzle-orm'
import { ActionResponse } from '@/types/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const postBodySchema = z.object({
  title: z.string().default('Untitled Note'),
  content: z.any().optional().default({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: ' ' }],
      },
    ],
  }),
})

export async function GET(): Promise<NextResponse<ActionResponse<Note[]>>> {
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
    const data = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
): Promise<NextResponse<ActionResponse<Note>>> {
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
    const body = await request.json()
    const validatedData = postBodySchema.parse(body)
    const result = await db.insert(notes).values({ ...validatedData, userId }).returning()
    return NextResponse.json({ success: true, data: result[0] })
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