import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/server/db'
import { user } from '@/shared/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false })
    }

    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    })

    return NextResponse.json({
      connected: currentUser?.googleCalendarConnected || false
    })
  } catch (error) {
    console.error('Calendar status error:', error)
    return NextResponse.json({ connected: false })
  }
}