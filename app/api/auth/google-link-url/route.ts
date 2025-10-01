import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// This endpoint generates the authorization URL for linking a secondary Google account.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/auth/link-callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ],
    // Pass along the final destination after the whole flow is complete
    state: new URL(request.url).searchParams.get('next') || '/',
  });

  return NextResponse.json({ authUrl });
}
