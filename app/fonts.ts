import localFont from "next/font/local";

export const interDisplay = localFont({
  src: [
    {
      path: "../public/fonts/InterDisplay-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/InterDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/InterDisplay-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/InterDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-inter-display",
  display: "swap",
});
