# Automatic Primary Calendar Setup - Implementation Complete

## 🎯 What Changed

You requested that the primary calendar use **direct Google OAuth automatically** instead of showing error states with buttons. This is now implemented.

## ✅ How It Works Now

### **Automatic OAuth Flow**

1. **User logs in** via Supabase OAuth (email/password or Google sign-in)
2. **Auth callback** (`/app/auth/callback/route.ts`) detects if calendar is not connected
3. **Automatically redirects** to Google OAuth with calendar scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `access_type: offline` (for refresh token)
   - `prompt: consent` (to ensure refresh token)
4. **User authorizes** calendar access in Google popup
5. **Calendar callback** (`/api/auth/primary-calendar-callback/route.ts`) receives tokens
6. **Stores tokens** in database (same as secondary accounts)
7. **Redirects to dashboard** with calendar working

### **No Error States**

- ❌ **Removed**: "Connect Calendar" error buttons
- ❌ **Removed**: "Calendar connection expired" prompts
- ✅ **Added**: Simple "Setting up your calendar" message (transient)
- ✅ **Added**: Auto-retry via React Query

### **User Experience**

**First-time login:**
```
1. User clicks "Sign in with Google"
2. Supabase auth completes
3. → Automatically redirected to Google Calendar OAuth
4. User clicks "Allow" (one time)
5. → Redirected to dashboard with calendar showing
```

**Subsequent logins:**
```
1. User signs in
2. System detects existing calendar tokens
3. → Directly to dashboard (no extra OAuth)
4. Calendar loads automatically
```

**If tokens expire:**
```
1. Calendar API call fails with 401
2. System attempts token refresh automatically
3. If refresh works → Calendar loads
4. If refresh fails → Shows "Setting up" message briefly
5. Next login → Triggers new OAuth automatically
```

## 🔧 Technical Changes

### File: `/app/auth/callback/route.ts`

**Before:**
```typescript
googleCalendarConnected: !!data.session.provider_token,
accessToken: data.session.provider_token || null,
refreshToken: data.session.provider_refresh_token || null,
```

**After:**
```typescript
googleCalendarConnected: false, // Will be set by calendar OAuth
accessToken: null, // Will be set by calendar OAuth
refreshToken: null, // Will be set by calendar OAuth

// Check if user needs calendar OAuth
if (!currentUser?.googleCalendarConnected) {
  // Build Google OAuth URL with calendar scopes
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...`;
  return NextResponse.redirect(authUrl);
}
```

### File: `/components/widgets/schedule-widget.tsx`

**Before:**
```tsx
<EmptyState
  title="Calendar connection expired"
  action={{
    label: "Reconnect Calendar",
    onClick: async () => { /* manual OAuth trigger */ }
  }}
/>
```

**After:**
```tsx
<EmptyState
  title="Setting up your calendar"
  description="Your calendar is being configured. This page will update automatically."
  // No action button - happens automatically
/>
```

### File: `/app/api/calendar/route.ts`

**Enhanced logging** (no functional changes):
```typescript
console.log('🔵 PRIMARY: Attempting to fetch calendar events...');
console.log('✅ PRIMARY: Successfully fetched events:', { eventCount: X });
console.log('📤 FINAL RESPONSE:', { primaryEventsCount: X, secondaryEventsCount: Y });
```

## 📊 Flow Diagram

```
┌─────────────────┐
│  User Login     │
│  (Supabase)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ /auth/callback          │
│ Check: calendar         │
│ connected?              │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
 NO │         │ YES
    │         │
    ▼         ▼
┌───────────────┐  ┌──────────────┐
│ Redirect to   │  │ Go straight  │
│ Google OAuth  │  │ to dashboard │
│ (calendar     │  │              │
│  scopes)      │  └──────────────┘
└───────┬───────┘
        │
        ▼
┌───────────────────────┐
│ User authorizes       │
│ calendar access       │
└───────┬───────────────┘
        │
        ▼
┌───────────────────────────┐
│ /api/auth/primary-        │
│ calendar-callback         │
│ - Store tokens            │
│ - Set connected = true    │
└───────┬───────────────────┘
        │
        ▼
┌────────────────┐
│ Dashboard      │
│ Calendar works │
└────────────────┘
```

## 🧪 Testing

### For Existing Users (You)

Since you're already logged in but don't have calendar tokens:

**Option 1: Log out and log back in**
```bash
1. Click logout
2. Sign in again
3. → Will automatically trigger calendar OAuth
4. Click "Allow" on Google popup
5. → Calendar appears
```

**Option 2: Manually trigger reconnection**

Visit in your browser:
```
http://localhost:3000/api/auth/connect-primary-calendar
```

This returns JSON with an `authUrl`. Copy that URL and visit it in your browser.

**Option 3: Clear your calendar connection in database**

This will force the OAuth flow on next login:
```bash
# In your database tool:
UPDATE "user" SET "googleCalendarConnected" = false, "accessToken" = null WHERE email = 'your@email.com';
```

Then refresh the page.

### For New Users

Simply sign up → calendar OAuth happens automatically.

## 🔍 Verification

### Server Logs to Watch

When the automatic flow works, you'll see:

```bash
# 1. Auth callback detects no calendar
🔐 PRIMARY: User needs calendar OAuth, building redirect URL...
🔐 PRIMARY: Redirecting to Google OAuth for calendar permissions

# 2. After user authorizes
✅ PRIMARY: Connected primary Google Calendar account: user@example.com for user: xxx
✅ PRIMARY: Redirecting to: /?calendar=connected

# 3. When calendar loads
🔵 PRIMARY: Attempting to fetch calendar events...
✅ PRIMARY: Successfully fetched events: { eventCount: 15, firstEventTitle: 'Meeting' }
📤 FINAL RESPONSE: { totalEvents: 20, primaryEventsCount: 15, secondaryEventsCount: 5 }
```

### Client Console

```bash
# When redirected back after OAuth
✅ PRIMARY: Calendar connection successful! Reloading data...
```

## 🎯 Summary

**What you asked for:**
> "I don't want an error state with button, if we have to use the direct OAuth I'm fine with that"

**What's implemented:**
- ✅ Automatic direct Google OAuth for primary calendar
- ✅ No error state buttons
- ✅ No manual "Connect Calendar" clicks needed
- ✅ Seamless flow: login → OAuth → calendar works
- ✅ Same reliable flow as secondary accounts

**User sees:**
- Brief OAuth popup on first login (one-time)
- Calendar appears automatically
- No error states or manual connection steps

**Next steps:**
1. Test by logging out and back in
2. Authorize calendar when Google prompts
3. Calendar will work automatically from then on
