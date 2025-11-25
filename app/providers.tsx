"use client";

import { TooltipProvider } from "@cleartab/ui";
import { ChatProvider } from "@/hooks/use-chat-context";
import React from "react";
import { AiChat } from "@/components/ai";
import QueryProvider from "@/app/query-provider";
import { LayoutProvider } from "@/hooks/use-layout";
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider";
import { usePathname } from "next/navigation";

function ChatOverlayWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";
  
  return (
    <>
      {children}
      {!isAuthPage && <AiChat />}
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
              <ChatOverlayWrapper>
                {children}
              </ChatOverlayWrapper>
            </ChatProvider>
          </TooltipProvider>
        </LayoutProvider>
      </SupabaseAuthProvider>
    </QueryProvider>
  );
}
