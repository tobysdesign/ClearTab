# Primary Calendar Not Showing - Root Cause & Fix

## 🔍 Root Cause Analysis

### The Problem
Your **primary account** (the one you log in with) shows no calendar events, but **secondary accounts** work perfectly.

### Why This Happens

**Secondary Accounts (✅ Working)**
- Use `/auth/link-callback` route
- Call `lightweightGoogleApi.exchangeCodeForTokens()` **directly with Google**
- Get tokens with explicit calendar scope: `https://www.googleapis.com/auth/calendar.readonly`
- Store access token + refresh token in `connected_accounts` table

**Primary Account (❌ Not Working)**
- Use `/auth/callback` route (Supabase OAuth)
- Get tokens from `data.session.provider_token` from Supabase
- **Problem**: Supabase's provider token may not include calendar scopes or may not be passed through correctly
- Even if `googleCalendarConnected` flag is set, the token doesn't have calendar API access

### Technical Flow Comparison

```
SECONDARY (Working):
User clicks "Add Account"
  → Direct Google OAuth with calendar scopes
  → /auth/link-callback receives code
  → exchangeCodeForTokens(code) → gets calendar-scoped tokens
  → Saves to connected_accounts table
  → ✅ Calendar events load successfully

PRIMARY (Broken):
User logs in
  → Supabase OAuth (generic scopes)
  → /auth/callback receives session
  → Gets provider_token from Supabase
  → ❌ Token lacks calendar scope or isn't valid for Calendar API
  → Calendar API returns 401/403 or empty results
```

## 🔧 The Fix

### Changes Made

1. **Enhanced Logging** (`app/api/calendar/route.ts`)
   - Added emoji-prefixed logs to track primary account flow
   - Logs show exactly where the primary calendar fetch fails
   - Final response log shows primary vs secondary event counts

2. **Dedicated Primary Calendar Connection** (`schedule-widget.tsx`)
   - Changed "Connect Calendar" button to use `/api/auth/connect-primary-calendar`
   - This triggers **direct Google OAuth** with explicit calendar scopes
   - Bypasses Supabase's provider token mechanism
   - Stores properly scoped tokens in the `user` table

3. **Better User Experience**
   - Added "Connect Primary Calendar" action to empty state
   - Updated error messages to be clearer about reconnection
   - Automatic redirect back to dashboard after successful connection

4. **Improved Callback Flow** (`primary-calendar-callback/route.ts`)
   - Redirects to `/?calendar=connected` instead of `/settings`
   - Users see their calendar immediately after connecting

### What Users Need to Do

**If you're currently experiencing this issue:**

1. Open the dashboard
2. You'll see either:
   - An error: "Calendar connection expired" or "Connect your calendar"
   - Empty state: "No events scheduled"
3. Click the "Connect Calendar" or "Connect Primary Calendar" button
4. Authorize Google Calendar access (will ask for calendar.readonly permission)
5. You'll be redirected back and your primary calendar events will appear

## 📊 Verification

### Server Logs to Check

After implementing the fix, watch for these logs:

```bash
# Successful primary calendar connection
✅ PRIMARY: Connected primary Google Calendar account: user@example.com for user: xxx
✅ PRIMARY: Redirecting to: /?calendar=connected

# Successful event fetch
🔵 PRIMARY: Attempting to fetch calendar events...
✅ PRIMARY: Successfully fetched events: { eventCount: 15, firstEventTitle: 'Meeting' }

# Final response showing both primary and secondary events
📤 FINAL RESPONSE: {
  totalEvents: 20,
  primaryEventsCount: 15,
  secondaryEventsCount: 5,
  eventTitles: [...]
}
```

### What Fixed It

The core fix is **separating primary account authentication from calendar authorization**.

- **Authentication** = Logging in (Supabase handles this)
- **Calendar Authorization** = Getting calendar-scoped tokens (Direct Google OAuth)

By using `/api/auth/connect-primary-calendar`, we get a fresh OAuth flow with:
```
scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
access_type: 'offline'
prompt: 'consent'
```

This ensures:
- ✅ Calendar API access
- ✅ Refresh token for long-term access
- ✅ Proper token storage in database
- ✅ Same flow as working secondary accounts

## 🚀 Next Steps

### For You Right Now

1. **Refresh your browser** - The updated code is in place
2. **Click "Connect Calendar"** when you see the prompt
3. **Verify events appear** - You should see your primary calendar events

### Optional: Verify Database State

If you want to check your current token status, visit:
```
http://localhost:3000/api/debug/calendar-status
```

This will show:
```json
{
  "primaryAccount": {
    "email": "your@email.com",
    "googleCalendarConnected": true/false,
    "hasAccessToken": true/false,
    "hasRefreshToken": true/false
  },
  "secondaryAccounts": [...]
}
```

### Long-term Improvement

Consider updating the initial sign-in flow to automatically trigger calendar connection:
- After Supabase login completes
- If `googleCalendarConnected === false`
- Automatically redirect to `/api/auth/connect-primary-calendar`

This would make the calendar "just work" for new users.

## 📝 Technical Details

### Files Changed

1. `app/api/calendar/route.ts` - Enhanced logging
2. `components/widgets/schedule-widget.tsx` - Updated connection flow
3. `app/api/auth/primary-calendar-callback/route.ts` - Better redirect
4. `app/api/debug/calendar-status/route.ts` - NEW diagnostic endpoint

### Database Schema

The fix uses these existing columns in the `user` table:
- `accessToken` - Google Calendar access token
- `refreshToken` - Google refresh token for long-term access
- `googleCalendarConnected` - Boolean flag
- `tokenExpiry` - When token expires

No schema changes needed!

## 🎯 Summary

**Problem**: Primary account logged in via Supabase doesn't get calendar-scoped tokens

**Solution**: Separate calendar authorization from authentication using dedicated OAuth flow

**Result**: Primary account now works exactly like secondary accounts

**User Action Required**: One-time "Connect Calendar" click to authorize calendar access
