"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/app/loading";
// Icons replaced with ASCII placeholders
import { useMutation } from "@tanstack/react-query";
import styles from "./page.module.css";

export default function OpenSettingsAndRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [revokeStatus, setRevokeStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (!errorParam) {
      window.dispatchEvent(
        new CustomEvent("openSettings", { detail: { tab: "Account" } }),
      );
      router.replace("/");
    }
  }, [router, errorParam]);

  const forceRevokeMutation = useMutation({
    mutationFn: async (providerAccountId: string) => {
      setRevokeStatus(null);
      const res = await fetch("/api/accounts/force-revoke-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerAccountId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to check status.");
      }
      return data;
    },
    onSuccess: (data) => {
      setRevokeStatus({
        message: data.message || "Success! Automatically retrying...",
        isError: false,
      });
      // Automatically retry the add account flow after a short delay
      setTimeout(async () => {
        try {
          const response = await fetch(
            "/api/auth/google-link-url?next=/settings",
          );
          if (!response.ok) {
            throw new Error("Failed to get authorization URL for retry.");
          }
          const { authUrl } = await response.json();
          window.location.href = authUrl;
        } catch (retryError: unknown) {
          setRevokeStatus({
            message:
              (retryError as Error)?.message ||
              "Could not automatically retry. Please add the account again manually.",
            isError: true,
          });
        }
      }, 1500); // Delay to allow user to read the success message
    },
    onError: (error: Error) => {
      setRevokeStatus({ message: error.message, isError: true });
    },
  });

  if (!errorParam) {
    return <Loading />;
  }

  const errorDetails = {
    message: errorParam,
    providerAccountId: null as string | null,
  };
  try {
    const parsedError = JSON.parse(errorParam);
    errorDetails.message = parsedError.error_message || errorParam;
    errorDetails.providerAccountId = parsedError.providerAccountId || null;
  } catch {
    // Error is not a JSON string
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.errorHeader}>
          <span className={styles.iconLarge}>⚠</span>
          <h1 className={styles.errorTitle}>Account Already Linked</h1>
        </div>
        <div className={styles.contentSpace}>
          <p className={styles.errorMessage}>{errorDetails.message}</p>

          <div className={styles.infoSection}>
            <p className={styles.infoSubtitle}>
              To resolve this, the owner of the Google account must:
            </p>
            <ol className={styles.instructionsList}>
              <li>
                Go to their Google Account settings (
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Manage Permissions
                </a>
                ).
              </li>
              <li>Find this application in the list of third-party apps.</li>
              <li>Remove all permissions for this application.</li>
            </ol>
          </div>

          <div className={styles.infoSection}>
            <p className={styles.infoSubtitle}>
              After revoking permissions, click here:
            </p>
            <button
              onClick={() => {
                if (errorDetails.providerAccountId) {
                  forceRevokeMutation.mutate(errorDetails.providerAccountId);
                } else {
                  setRevokeStatus({
                    message:
                      "Could not determine account ID to check. Please try the flow again.",
                    isError: true,
                  });
                }
              }}
              disabled={forceRevokeMutation.isPending}
              className={styles.checkButton}
            >
              {forceRevokeMutation.isPending
                ? "Checking..."
                : "I have revoked access in Google, check again"}
            </button>
            {revokeStatus && (
              <div
                className={`${styles.statusContainer} ${revokeStatus.isError ? styles.statusContainerError : styles.statusContainerSuccess}`}
              >
                {revokeStatus.isError ? (
                  <span className={styles.iconSmall}>⚠</span>
                ) : (
                  <span className={styles.iconSmall}>✓</span>
                )}
                <span>{revokeStatus.message}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => router.replace("/")}
          className={styles.returnButton}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
