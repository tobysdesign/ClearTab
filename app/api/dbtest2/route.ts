import { NextResponse } from 'next/server';
import { db, testConnection } from '@/server/db-fixed';
import { notes } from '@/shared/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  console.log('DB Test 2 API endpoint called with fixed connection');
  
  try {
    // First test the raw connection
    const connectionResult = await testConnection();
    console.log('Connection test result:', connectionResult);
    
    // Try a simple count query with 5 second timeout
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const notesCount = await db.select({ value: count() }).from(notes);
    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      notesCount: notesCount[0]?.value ?? 0,
      connectionTestResult: connectionResult,
      duration: `${duration}ms`,
      message: "Alternative database connection test"
    });
  } catch (error) {
    console.error('Alternative database test error:', error);
    
    return NextResponse.json({ 
      status: "error", 
      message: "Alternative database connection failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 