"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "@/hooks/use-chat-context";
import React from "react";
import ChatOverlay from "@/components/ai/chat-overlay";
import QueryProvider from "@/app/query-provider";
import { LayoutProvider } from "@/hooks/use-layout";
import ClientProviders from "./client-providers";
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider";
import { usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  return (
    <QueryProvider>
      <SupabaseAuthProvider>
        <ClientProviders>
          <LayoutProvider>
            <TooltipProvider>
              <ChatProvider>
                {children}
                {!isAuthPage && <ChatOverlay />}
              </ChatProvider>
            </TooltipProvider>
          </LayoutProvider>
        </ClientProviders>
      </SupabaseAuthProvider>
    </QueryProvider>
  );
}
