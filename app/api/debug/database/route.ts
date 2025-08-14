import { NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Try a simple query
    const result = await db.query.user.findMany({
      limit: 1,
      columns: {
        id: true,
        email: true,
        googleCalendarConnected: true
      }
    })
    
    console.log('Database query result:', result)
    
    return NextResponse.json({
      message: 'Database test working',
      userCount: result.length,
      sampleUser: result[0] || null
    })
  } catch (error) {
    console.error('Database test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    
    return NextResponse.json({ 
      error: 'Database test failed',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}