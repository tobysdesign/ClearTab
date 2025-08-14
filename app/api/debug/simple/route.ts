import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test endpoint
    return NextResponse.json({
      message: 'Simple test working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json({ error: 'Simple test failed' }, { status: 500 })
  }
}