"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing you out...</h1>
        <p className="text-white">Please wait while we clear your session.</p>
        <p className="text-sm text-white/60 mt-4">
          If you're not redirected in a few seconds,{" "}
          <a href="/login" className="underline">
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
