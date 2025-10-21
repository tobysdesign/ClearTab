import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple stub for Google link URL
    return NextResponse.json({
      success: false,
      authUrl: null,
      message: "Google account linking not yet implemented"
    });
  } catch (error) {
    console.error('Error getting Google link URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Google link URL'
    }, { status: 500 });
  }
}
