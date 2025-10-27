"use client";

import { TooltipProvider } from "@cleartab/ui";
import { ChatProvider } from "@/hooks/use-chat-context";
import React from "react";
import ChatOverlay from "@/components/ai/chat-overlay";
import QueryProvider from "@/app/query-provider";
import { LayoutProvider } from "@/hooks/use-layout";
import ClientProviders from "./client-providers";
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider";
import { usePathname } from "next/navigation";

function ChatOverlayWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";
  
  return (
    <>
      {children}
      {!isAuthPage && <ChatOverlay />}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <QueryProvider>
      <SupabaseAuthProvider>
        <LayoutProvider>
          <TooltipProvider>
            <ChatProvider>
              <ClientProviders>
                <ChatOverlayWrapper>
                  {children}
                </ChatOverlayWrapper>
              </ClientProviders>
            </ChatProvider>
          </TooltipProvider>
        </LayoutProvider>
      </SupabaseAuthProvider>
    </QueryProvider>
  );
}
