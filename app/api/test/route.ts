import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Test API endpoint called');
  return NextResponse.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    message: "This is a test endpoint without database operations"
  });
} 