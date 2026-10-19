import "@/app/globals.css";
import "@/packages/ui/src/styles/index.css";

import type { Metadata } from "next";
import { interDisplay } from "./fonts";
import Providers from "./providers";
import React, { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import dynamic from "next/dynamic";
import { Toaster as SonnerToaster } from "sonner";
import Loading from "./loading";
import { TaskModalProvider } from "@/hooks/use-task-modal";

const CharcoalWave = dynamic(
  () => import("@/components/ui/charcoal-wave").then((mod) => ({ default: mod.CharcoalWave })),
  { loading: () => null }
);

const SettingsDrawer = dynamic(
  () => import("@/components/settings/settings-drawer").then((mod) => ({ default: mod.SettingsDrawer })),
  { loading: () => null }
);

const TasksDrawer = dynamic(
  () => import("@/components/tasks/tasks-drawer").then((mod) => ({ default: mod.TasksDrawer })),
  { loading: () => null }
);
import styles from "./layout.module.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: next-themes sets class="dark" + color-scheme on <html>
    // client-side (server can't match it); this only silences <html>'s own attributes.
    <html lang="en" className={interDisplay.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      {/* Font family comes from the global `html` rule (var(--font-inter-display));
          the variable is provided by interDisplay.variable on <html> above. */}
      <body>
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
