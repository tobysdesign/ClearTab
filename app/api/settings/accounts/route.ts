import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple stub for connected accounts
    // Return empty array since account management isn't fully implemented
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch connected accounts'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Simple stub for removing accounts
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({
        success: false,
        error: 'Account ID is required'
      }, { status: 400 });
    }

    // Return success without actually doing anything
    return NextResponse.json({
      success: true,
      message: 'Account management not yet implemented'
    });
  } catch (error) {
    console.error('Error removing account:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove account'
    }, { status: 500 });
  }
}