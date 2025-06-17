'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChatProvider } from '@/hooks/use-chat-context'
import { Toaster } from '@/components/ui/toaster'
import { useState } from 'react'
import React from 'react'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChatProvider>
            <Toaster />
            {children}
          </ChatProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}