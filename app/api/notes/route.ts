import { NextResponse } from 'next/server'
import { z } from 'zod'
import { notes, type Note, BlockNoteContentSchema, EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema'
import { db } from '@/server/db'
import { desc, eq } from 'drizzle-orm'
import { ActionResponse } from '@/types/actions'
import { getServerSession, type Session } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const postBodySchema = z.object({
  title: z.string().default('Untitled Note'),
  content: BlockNoteContentSchema.optional().default(EMPTY_BLOCKNOTE_CONTENT),
  userId: z.string(), // Add userId to the schema
})

export async function GET(): Promise<NextResponse<ActionResponse<Note[]>>> {
  console.time('notes-api-total');
  console.log("Notes API: Starting GET request");
  
  console.time('notes-session');
  const session = await getServerSession(authOptions);
  console.timeEnd('notes-session');
  
  if (!session?.user?.id) { // Check for session and user ID
    console.log("GET /api/notes: User not authenticated");
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  console.log("Notes API: Got user ID:", userId);

  try {
    console.time('notes-db-query');
    const data = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt))
    console.timeEnd('notes-db-query');
    
    console.log("GET /api/notes: Fetched notes data for userId", userId, data);
    console.timeEnd('notes-api-total');
    
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) { // Check for session and user ID
    return NextResponse.json(
      { success: false, error: 'User not authenticated' },
      { status: 401 }
    );
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json()
    console.log("POST /api/notes: Received body", JSON.stringify(body, null, 2));

    const validatedData = postBodySchema.parse({ ...body, userId }); // Pass userId to the schema
    console.log("POST /api/notes: Validated data", JSON.stringify(validatedData, null, 2));

    // Explicitly construct the object for insertion to ensure correct types
    const noteToInsert = {
      title: validatedData.title,
      content: validatedData.content || EMPTY_BLOCKNOTE_CONTENT,
      userId: validatedData.userId,
    };

    const result = await db.insert(notes).values(noteToInsert).returning()
    console.log("POST /api/notes: Inserted result", JSON.stringify(result, null, 2));

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