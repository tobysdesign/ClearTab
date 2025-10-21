"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import { CharcoalWave } from "@/components/ui/charcoal-wave";
import styles from "./page.module.css";

// Simple Login Widget Component
function SimpleLoginWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await signIn("google");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginWidget}>
      <div className={styles.loginContent}>
        <h1 className={styles.loginTitle}>Get ClearTab</h1>
        <p className={styles.loginSubtitle}>
          Your personal productivity dashboard
        </p>

        <Button
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className={styles.googleIcon}>
            <g fill="none" fillRule="evenodd">
              <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </g>
          </svg>
          Sign in with Google
        </Button>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <p className={styles.loginDescription}>
          Get access to your personalized productivity dashboard
        </p>
      </div>
    </div>
  );
}

export default function SimpleLoginPage() {
  return (
    <div className={styles.container}>
      {/* Background shader */}
      <CharcoalWave />

      {/* Simple centered login */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <SimpleLoginWidget />
      </div>
    </div>
  );
}