"use client";

import "@/app/globals.css";
import "@/styles/material-3.css";
import { Inter, Tinos } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "./client-providers";
import React, { Suspense, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CharcoalWave } from "@/components/ui/charcoal-wave";
import { Toaster as DefaultToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import Loading from "./loading";
import styles from "./layout.module.css";

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

interface ExtensionLayoutProps {
  children: React.ReactNode;
}

export default function ExtensionLayout({ children }: ExtensionLayoutProps) {
  useEffect(() => {
    // Set document title for extension
    document.title = "ClearTab";

    // Set favicon
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    favicon.type = 'image/svg+xml';
    favicon.rel = 'icon';
    favicon.href = '/dibs.svg';
    document.getElementsByTagName('head')[0].appendChild(favicon);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Productivity at your finger tips." />
      </head>
      <body className={cn(inter.variable, tinos.variable)}>
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
          <div style={{ width: "150px", height: "82.8px" }}>
            <img
              src="/assets/loading.gif"
              alt="Loading..."
              width={500}
              height={276}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
            />
          </div>
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
        >
          <Providers>
            <div className={styles.container}>
              <CharcoalWave />
              <main className={styles.mainContent}>
                <Suspense fallback={<Loading />}>{children}</Suspense>
              </main>
            </div>
            <DefaultToaster />
            <SonnerToaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}