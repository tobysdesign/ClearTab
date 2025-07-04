import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { userPreferences } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // TODO: Get actual user ID from auth session
    const userId = 1

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
      columns: { openaiApiKey: true }
    })

    return NextResponse.json({
      hasApiKey: !!prefs?.openaiApiKey
    })
  } catch (error) {
    console.error('Error checking API key:', error)
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    )
  }
} 