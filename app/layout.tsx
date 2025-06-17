import "@/app/globals.css"
import "@/app/common.css"

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { CharcoalWave } from '@/components/ui/charcoal-wave'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Productivity Dashboard',
  description: 'A dynamic productivity platform leveraging AI and modern web technologies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <CharcoalWave />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}