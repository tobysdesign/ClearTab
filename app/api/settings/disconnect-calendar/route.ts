import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Simple stub for disconnecting calendar
    return NextResponse.json({
      success: true,
      message: "Calendar disconnect not yet implemented"
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect calendar'
    }, { status: 500 });
  }
}
