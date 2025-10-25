"use client";

import { BrandedLoader } from "@cleartab/ui";

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
        zIndex: 9999,
      }}
    >
      <BrandedLoader size="medium" />
    </div>
  );
}
