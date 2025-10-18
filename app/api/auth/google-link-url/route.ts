import { NextRequest, NextResponse } from 'next/server';
import { lightweightGoogleApi } from '@/lib/lightweight-google-api';

// This endpoint generates the authorization URL for linking a secondary Google account.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/auth/link-callback`;

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];

  // Pass along the final destination after the whole flow is complete
  const state = new URL(request.url).searchParams.get('next') || '/';

  const authUrl = lightweightGoogleApi.getAuthUrl(scopes, redirectUri, state);

  return NextResponse.json({ authUrl });
}
