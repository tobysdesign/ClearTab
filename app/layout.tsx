import '@/app/globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import Providers from './providers'
import React, { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { CharcoalWave } from '@/components/ui/charcoal-wave'
import { Toaster as DefaultToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Loading from './loading'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter-display',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Bye',
  description: 'An AI Companion for your daily life.',
  icons: {
    icon: '/dibs.svg',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Tiny:ital,wght@0,400;0,500;1,300;1,400;1,500&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={cn(inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
        >
          <Providers session={session}>
            <div className="relative flex min-h-screen flex-col">
              <CharcoalWave />
              <main className="flex-1 z-20">
                <Suspense fallback={<Loading />}>
                  {children}
                </Suspense>
              </main>
            </div>
            <DefaultToaster />
            <SonnerToaster />
          </Providers>
        </ThemeProvider>
        {/* Hotjar Tracking Code for https://bye-ai.vercel.app */}
        <Script id="hotjar-script">
          {`
            (function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:3890201,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r); })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      </body>
    </html>
  )
}