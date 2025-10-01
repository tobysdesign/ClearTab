import "@/app/globals.css";
import "@/styles/material-3.css";

import type { Metadata } from "next";
import { Inter, Tinos } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from "./providers";
import React, { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CharcoalWave } from "@/components/ui/charcoal-wave";
import { Toaster as DefaultToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import Loading from "./loading";
import Script from "next/script";

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

export const metadata: Metadata = {
  title: "ClearTab",
  description: "Productivity at your finger tips.",
  icons: {
    icon: "/dibs.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
              width="500"
              height="276"
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
            <div className="relative flex min-h-screen flex-col">
              <CharcoalWave />
              <main className="flex-1 z-20">
                <Suspense fallback={<Loading />}>{children}</Suspense>
              </main>
            </div>
            <DefaultToaster />
            <SonnerToaster />
          </Providers>
        </ThemeProvider>
        {/* Hotjar Tracking Code for https://bye-ai.vercel.app */}
        <Script id="hotjar-script">
          {`
            (function(h,o,t,j,a,r){ h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:3890201,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r); })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      </body>
    </html>
  );
}
