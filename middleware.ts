import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

// /demo and /tab: public pages handled by client/extension auth
const PUBLIC_PAGES = ['/', '/privacy', '/demo', '/tab']
// Dev-only widget responsiveness harness (never public in production)
if (process.env.NODE_ENV !== 'production') PUBLIC_PAGES.push('/widget-sizes')

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  // Landing and legal pages are public (Google's OAuth reviewers must reach them signed out)
  const isPublicPage = PUBLIC_PAGES.includes(req.nextUrl.pathname)
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  // Allow API routes and logout to pass through
  if (isApiRoute || isPublicPage || req.nextUrl.pathname.startsWith('/logout')) {
    return NextResponse.next()
  }

  // If on login page and already authenticated, redirect to home
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/tab', req.url))
  }

  // If not authenticated and not on login page, redirect to login
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Exclude ALL Next.js internals and public assets from middleware to avoid intercepting chunk/flight requests.
  // 'icon' also covers icons/, icon.svg and icon-192/512.png so favicons and bookmarks work signed out.
  // api/extension/ is skipped too: the session check here sets a default authjs.callback-url
  // cookie, which could override the one /api/extension/authorize sets before going to Google.
  matcher: ['/((?!_next/|api/extension/|favicon.ico|icon|apple-icon|manifest.json|manifest.webmanifest|assets|robots.txt).*)'],
}