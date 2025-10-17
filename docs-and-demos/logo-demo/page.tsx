"use client";

import { AnimatedTobyLogo } from "@/components/ui/animated-toby-logo";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function LogoDemoPage() {
  const [mode, setMode] = useState<"binary" | "brand">("brand");

  // Auto-toggle between modes every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMode((prev) => (prev === "brand" ? "binary" : "brand"));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <AnimatedTobyLogo color="#ffffff" mode={mode} />
      </div>
    </div>
  );
}
