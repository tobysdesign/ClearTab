import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  // Allow API routes and logout to pass through
  if (isApiRoute || req.nextUrl.pathname.startsWith('/logout')) {
    return NextResponse.next()
  }

  // If on login page and already authenticated, redirect to home
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
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
  // Exclude ALL Next.js internals and public assets from middleware to avoid intercepting chunk/flight requests
  matcher: ['/((?!_next/|favicon.ico|assets|icons|manifest.json|robots.txt).*)'],
}