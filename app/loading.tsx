"use client";

import Image from "next/image";

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
      <div style={{ width: "150px", height: "82.8px" }}>
        <Image
          src="/assets/loading.gif"
          alt="Loading..."
          width={500}
          height={276}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
          unoptimized
        />
      </div>
    </div>
  );
}
