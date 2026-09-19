import { NextResponse } from 'next/server';

/**
 * Legacy logout route for Supabase.
 * Now a no-op as NextAuth handles signout on the client side or via its own internal routes.
 */
export async function POST() {
  return NextResponse.json({ success: true, message: 'Signed out successfully' });
}
