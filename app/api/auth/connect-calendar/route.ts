import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Simple stub for connecting calendar
    return NextResponse.json({
      success: false,
      authUrl: null,
      message: "Calendar connection not yet implemented"
    });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect calendar'
    }, { status: 500 });
  }
}
