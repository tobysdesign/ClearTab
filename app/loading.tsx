"use client";

import { BrandedLoader } from "@/components/ui/branded-loader";

export default function Loading() {
  return (
    <div
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
  );
}
