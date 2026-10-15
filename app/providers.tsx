"use client";

import { TooltipProvider } from "@cleartab/ui";
import { ChatProvider } from "@/hooks/use-chat-context";
import React from "react";
import dynamic from "next/dynamic";

const AiChat = dynamic(
  () => import("@/components/ai").then((mod) => ({ default: mod.AiChat })),
  { ssr: false }
);

import QueryProvider from "@/app/query-provider";
import { LayoutProvider } from "@/hooks/use-layout";
import { AuthProvider } from "@/components/auth/auth-provider";
import { usePathname } from "next/navigation";

function ChatOverlayWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The /demo page renders its own chat, wired to a scripted model
  const isAuthPage = pathname === "/login" || pathname === "/demo";
  
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
      <AuthProvider>
        <LayoutProvider>
          <TooltipProvider>
            <ChatProvider>
              <ChatOverlayWrapper>
                {children}
              </ChatOverlayWrapper>
            </ChatProvider>
          </TooltipProvider>
        </LayoutProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
