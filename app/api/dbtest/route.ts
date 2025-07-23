import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { notes, tasks, user } from '@/shared/schema';

export const runtime = 'edge';

export async function GET() {
  console.log('DB Test API endpoint called');
  console.time('simple-db-query');
  
  try {
    // Try a simple test query first
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Basic DB test result:', result);
    
    // Get table counts to diagnose data issue
    const notesCount = await db.select({ count: sql`count(*)` }).from(notes);
    const tasksCount = await db.select({ count: sql`count(*)` }).from(tasks);
    const usersCount = await db.select({ count: sql`count(*)` }).from(user);
    
    console.timeEnd('simple-db-query');
    
    return NextResponse.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      connectionWorking: true,
      tables: {
        notes: notesCount[0]?.count || 0,
        tasks: tasksCount[0]?.count || 0,
        users: usersCount[0]?.count || 0
      },
      message: "Database connection test"
    });
  } catch (error) {
    console.error('Database test error:', error);
    console.timeEnd('simple-db-query');
    
    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 