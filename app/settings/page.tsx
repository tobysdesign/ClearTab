"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/app/loading";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

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
        } catch (retryError: any) {
          setRevokeStatus({
            message:
              retryError.message ||
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

  let errorDetails = {
    message: errorParam,
    providerAccountId: null as string | null,
  };
  try {
    const parsedError = JSON.parse(errorParam);
    errorDetails.message = parsedError.error_message || errorParam;
    errorDetails.providerAccountId = parsedError.providerAccountId || null;
  } catch (e) {
    // Error is not a JSON string
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full p-6 bg-[#111111] rounded-lg border border-[#2A2A2A]">
        <div className="flex items-center gap-2 text-red-400 mb-4">
          <AlertCircle className="h-5 w-5" />
          <h1 className="text-lg font-medium">Account Already Linked</h1>
        </div>
        <div className="space-y-4 text-left">
          <p className="text-sm text-white/70">{errorDetails.message}</p>

          <div className="p-4 bg-black/20 rounded">
            <p className="text-xs text-white/60 font-medium mb-2">
              To resolve this, the owner of the Google account must:
            </p>
            <ol className="list-decimal list-inside text-xs text-white/60 space-y-1">
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

          <div className="p-4 bg-black/20 rounded">
            <p className="text-xs text-white/60 font-medium mb-2">
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
              className="w-full text-center p-2 text-sm rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {forceRevokeMutation.isPending
                ? "Checking..."
                : "I have revoked access in Google, check again"}
            </button>
            {revokeStatus && (
              <div
                className={`mt-3 p-2 text-xs rounded flex items-center gap-2 ${revokeStatus.isError ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}
              >
                {revokeStatus.isError ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{revokeStatus.message}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => router.replace("/")}
          className="mt-6 text-sm text-white/60 underline hover:text-white"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
