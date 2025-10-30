import "@/app/globals.css";
import "@/packages/ui/src/styles/index.css";

import type { Metadata } from "next";
import { interDisplay } from "./fonts";
import Providers from "./providers";
import React, { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CharcoalWave } from "@/components/ui/charcoal-wave";
import { Toaster as SonnerToaster } from "sonner";
import Loading from "./loading";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
import { TasksDrawer } from "@/components/tasks/tasks-drawer";
import { TaskModalProvider } from "@/hooks/use-task-modal";
import styles from "./layout.module.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={interDisplay.variable} suppressHydrationWarning>
      <body className={interDisplay.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
          disableTransitionOnChange
        >
          <TaskModalProvider>
            <Providers>
              <div className={styles.container}>
                <CharcoalWave />
                <main className={styles.mainContent}>
                  <Suspense fallback={<Loading />}>{children}</Suspense>
                </main>
              </div>
              <SettingsDrawer />
              <TasksDrawer />
              <SonnerToaster />
            </Providers>
          </TaskModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
