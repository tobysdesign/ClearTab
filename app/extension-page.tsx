"use client";

import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { LayoutProvider } from '@/hooks/use-layout'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExtensionAuthProvider } from '@/components/auth/extension-auth-provider'
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatProvider } from "@/hooks/use-chat-context"
import ChatOverlay from "@/components/ai/chat-overlay"
import { ThemeProvider } from "@/components/theme-provider"
import { CharcoalWave } from "@/components/ui/charcoal-wave"
import { Toaster as DefaultToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { Inter, Tinos } from "next/font/google"
import { cn } from "@/lib/utils"
import React, { Suspense, useEffect } from 'react'
import Loading from "./loading"
import { BrandedLoader } from "@cleartab/ui"
import styles from "./layout.module.css"
import "@/app/globals.css"
import "@/styles/material-3.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-display",
  display: "swap",
});

const tinos = Tinos({
  subsets: ["latin"],
  variable: "--font-tinos",
  weight: ["400", "700"],
  display: "swap",
});

// Create a client for extension use
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function ExtensionPage() {
  useEffect(() => {
    // Set document title for extension
    document.title = "ClearTab";

    // Set favicon
    const favicon = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
    favicon.type = 'image/svg+xml';
    favicon.rel = 'icon';
    favicon.href = '/dibs.svg';
    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(favicon);
    }

    // Remove initial loader
    const removeLoader = () => {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loader.remove(), 300);
      }
    };

    // Remove loader after a short delay to ensure everything is rendered
    const timer = setTimeout(removeLoader, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(inter.variable, tinos.variable)}>
      <div
        id="initial-loader"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#09090B",
          zIndex: 9999,
        }}
      >
        <BrandedLoader size="large" />
      </div>

      <QueryClientProvider client={queryClient}>
        <ExtensionAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="theme"
          >
            <LayoutProvider>
              <TooltipProvider>
                <ChatProvider>
                  <div className={styles.container}>
                    <CharcoalWave />
                    <main className={styles.mainContent}>
                      <Suspense fallback={<Loading />}>
                        <SkipOnboardingHandler />
                        <DashboardClient
                          notes={<NotesWidget />}
                          tasks={<TasksWidget searchQuery="" />}
                        />
                      </Suspense>
                    </main>
                  </div>
                  <ChatOverlay />
                  <DefaultToaster />
                  <SonnerToaster />
                </ChatProvider>
              </TooltipProvider>
            </LayoutProvider>
          </ThemeProvider>
        </ExtensionAuthProvider>
      </QueryClientProvider>
    </div>
  );
}