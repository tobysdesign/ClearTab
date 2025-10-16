"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        // Always redirect to login after attempting to log out
        router.replace("/login");
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Signing you out...</h1>
        <p className={styles.message}>Please wait while we clear your session.</p>
        <p className={styles.footer}>
          If you&apos;re not redirected in a few seconds,{" "}
          <a href="/login" className={styles.link}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
