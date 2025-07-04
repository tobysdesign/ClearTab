"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
      <Card className="w-full max-w-md shadow-lg border border-border">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <Image src="/dibs.svg" alt="Logo" width={60} height={60} />
            <CardTitle className="text-2xl font-bold">AI Productivity Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
            <svg width="18" height="18" viewBox="0 0 256 262" className="mr-2">
              <path fill="#4285F4" d="M255.72 133.5c0-12.3-1.1-24.1-3.2-35.6H130v67.4h71.5c-3.1 16.8-12.5 31-26.6 40.5v33h43c25.1-23.1 39.6-57.1 39.6-98.3z" />
              <path fill="#34A853" d="M130 261.6c35.7 0 65.6-11.8 87.4-31.9l-43-33c-12 8.1-27.4 13-44.4 13-34.2 0-63.3-23.1-73.6-54.3H13.7v34.1C35.2 232 79.7 261.6 130 261.6z" />
              <path fill="#FBBC05" d="M56.4 155.4c-4.6-13.8-4.6-28.7 0-42.5V78.8H13.7c-18.6 36.9-18.6 78.9 0 115.8l42.7-39.2z" />
              <path fill="#EA4335" d="M130 52.5c18.9 0 35.8 6.5 49.1 19.4l36.7-36.7C195.4 11.8 165.7 0 130 0 79.7 0 35.2 29.6 13.7 78.8l42.7 34.1C66.7 75.6 95.8 52.5 130 52.5z" />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 