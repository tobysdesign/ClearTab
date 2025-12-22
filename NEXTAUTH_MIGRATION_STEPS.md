# NextAuth Migration - Next Steps

## ✅ Completed
- NextAuth installed and configured
- API routes updated to use NextAuth sessions
- Middleware updated
- New AuthProvider created
- Environment variables added to .env.local

## 📋 Required External Updates

### 1. Google Cloud Console - Update Redirect URIs

Go to: https://console.cloud.google.com/apis/credentials

**Current redirect URLs should be REPLACED with:**
```
http://localhost:3000/api/auth/callback/google
https://cleartab.app/api/auth/callback/google
https://t0by-toby-skyrings-projects.vercel.app/api/auth/callback/google
```

**Remove these old URLs:**
- ❌ `http://localhost:3000/auth/callback`
- ❌ `http://localhost:3000/api/auth/google-callback`
- ❌ `http://localhost:3000/api/auth/primary-calendar-callback`

### 2. Vercel Environment Variables

Add these to your Vercel project:

```
NEXTAUTH_SECRET=YMZ7zX2OvPqLesBGYjIjS++NHGg1kJ0anZ9Ws2QFiPo=
NEXTAUTH_URL=https://t0by-toby-skyrings-projects.vercel.app
AUTH_TRUST_HOST=true
```

**Keep existing variables:**
- DATABASE_URL (already updated to pooler)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

**Can remove (no longer needed):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SESSION_SECRET (replaced by NEXTAUTH_SECRET)

### 3. Test Locally

1. Update Google Cloud Console redirect URIs (step 1 above)
2. Restart dev server: `npm run dev`
3. Go to `http://localhost:3000`
4. Click "Sign in with Google"
5. Should redirect to `/api/auth/signin/google` then Google OAuth
6. After auth, should redirect back to home with calendar permissions

### 4. Deploy to Vercel

1. Update Vercel env vars (step 2 above)
2. Push changes to GitHub
3. Vercel will auto-deploy

## 🎯 Benefits of This Migration

- ✅ **Single OAuth flow** - No more dual auth (Supabase + Google)
- ✅ **Calendar works immediately** - Tokens obtained at login
- ✅ **Simpler redirect configuration** - One callback URL format
- ✅ **No more Site URL issues** - Works same locally and in production
- ✅ **Industry standard** - NextAuth is the standard for Next.js auth

## 🗑️ Can Remove Later (Optional Cleanup)

After verifying everything works:
- Remove `@supabase/ssr`, `@supabase/auth-helpers-*` from package.json
- Delete `/components/auth/supabase-auth-provider.tsx`
- Delete `/lib/supabase/` directory
- Remove Supabase-related API routes if not using Supabase database
