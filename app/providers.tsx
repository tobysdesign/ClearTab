'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ChatProvider } from '@/hooks/use-chat-context'
import React from 'react'
import ChatOverlay from '@/components/ai/chat-overlay'
import QueryProvider from '@/app/query-provider'
import ClientProviders from './client-providers'
import type { Session } from 'next-auth'
import { usePathname } from 'next/navigation'
import Loading from './loading'

export default function Providers({ 
    children,
    session 
}: { 
    children: React.ReactNode,
    session: Session | null
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  return (
    <QueryProvider>
        <ClientProviders session={session}>
            <TooltipProvider>
                <ChatProvider>
                    {children}
            {!isAuthPage && <ChatOverlay />}
                </ChatProvider>
            </TooltipProvider>
        </ClientProviders>
    </QueryProvider>
  )
}