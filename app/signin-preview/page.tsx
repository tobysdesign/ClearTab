'use client'

// Dev-only preview of the signed-out extension screen. ExtensionSignIn normally only renders
// under IS_EXTENSION, so this route exists purely to view/iterate on it in the web dev server.
// 404s in production (and the middleware only makes it public outside production).
import { notFound } from 'next/navigation'
import { ExtensionSignIn } from '@/components/auth/extension-sign-in'

export default function SignInPreview() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <ExtensionSignIn />
}
