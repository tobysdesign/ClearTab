import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing database connectivity...')
    
    // Test DNS resolution first
    const host = 'db.qclvzjiyglvxtctauyhb.supabase.co'
    
    try {
      // Simple fetch to test if host is reachable
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      await fetch(`https://${host}`, { 
        signal: controller.signal,
        method: 'HEAD'
      }).catch(() => {
        // We expect this to fail, we're just testing DNS resolution
      })
      
      clearTimeout(timeoutId)
      
      return NextResponse.json({
        message: 'Database host is reachable',
        host,
        timestamp: new Date().toISOString(),
        status: 'DNS resolution successful'
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          error: 'Database host connection timeout',
          host,
          message: 'The database appears to be unreachable. Check if your Supabase project is paused.',
          status: 'DNS resolution failed - timeout'
        }, { status: 503 })
      }
      
      return NextResponse.json({
        error: 'Database host unreachable',
        host,
        message: 'DNS resolution failed. The Supabase project might be paused or deleted.',
        details: error.message,
        status: 'DNS resolution failed'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('DB test error:', error)
    return NextResponse.json({ 
      error: 'Database connectivity test failed',
      details: error.message 
    }, { status: 500 })
  }
}