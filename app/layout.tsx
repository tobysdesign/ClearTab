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
import { BrandedLoader } from "@/components/ui/branded-loader";
import { SettingsDrawer } from "@/components/settings/settings-drawer";
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

// For extension builds, we'll conditionally disable metadata
const isExtension = process.env.IS_EXTENSION === "true";

// Only export metadata for non-extension builds
export const metadata: Metadata = isExtension ? {} as Metadata : {
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
          <BrandedLoader size="large" />
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
            <SettingsDrawer />
            <DefaultToaster />
            <SonnerToaster />
          </Providers>
        </ThemeProvider>
        {/* Only include Hotjar for non-extension builds */}
        {!isExtension && (
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
        )}
      </body>
    </html>
  );
}
