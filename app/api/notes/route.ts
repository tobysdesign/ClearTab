import { NextResponse } from 'next/server'
import { z } from 'zod'
import { insertNoteSchema, Note, yooptaContentSchema } from '@/shared/schema'
import { MOCK_NOTES, addMockNote } from '@/lib/mock-data'

const postBodySchema = insertNoteSchema.pick({ title: true, content: true }).extend({
  content: yooptaContentSchema.default({})
});

export async function GET() {
  return NextResponse.json(MOCK_NOTES);
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = postBodySchema.parse(json)

    // TODO: Replace with actual user ID from session/auth
    const userId = 1

    const newNote = addMockNote({
      userId,
      title: body.title,
      content: body.content,
      updatedAt: new Date(),
    })

    console.log('Note created:', newNote)

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
} 