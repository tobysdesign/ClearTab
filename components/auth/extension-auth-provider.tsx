"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createExtensionClient } from "@/lib/supabase/extension-client";
import type { User, Session } from "@supabase/supabase-js";
import { storeSession, removeSession } from "@/lib/session-store";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (provider: "google") => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an ExtensionAuthProvider");
  }
  return context;
}

interface ExtensionAuthProviderProps {
  children: React.ReactNode;
}

export function ExtensionAuthProvider({ children }: ExtensionAuthProviderProps) {
  console.log("ExtensionAuthProvider: Component rendering");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => {
    console.log("ExtensionAuthProvider: Creating Supabase client");
    return createExtensionClient();
  });

  useEffect(() => {
    console.log("ExtensionAuthProvider: useEffect triggered!");

    if (!supabase) {
      console.warn("ExtensionAuthProvider: No supabase client available, working offline");
      setLoading(false);
      return;
    }

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Initialize session immediately from storage (fast, synchronous check)
    const initSession = async () => {
      console.log("ExtensionAuthProvider: Checking for existing session in storage");

      try {
        // Set a timeout for the session check to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Session check timeout'));
          }, 5000); // 5 second timeout
        });

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        clearTimeout(timeoutId);

        if (!mounted) return;

        console.log("ExtensionAuthProvider: Session check result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          email: session?.user?.email,
          error: error?.message,
        });

        if (session && session.user) {
          // Generate or retrieve session ID
          let storedSessionId = localStorage.getItem("session_id");
          if (!storedSessionId) {
            storedSessionId = crypto.randomUUID();
            localStorage.setItem("session_id", storedSessionId);
          }

          // Store the session for future API calls
          storeSession(storedSessionId, session.user, session);
          setSession(session);
          setUser(session.user);
          console.log("ExtensionAuthProvider: User set:", session.user.email);
        } else {
          // No active session
          const storedSessionId = localStorage.getItem("session_id");
          if (storedSessionId) {
            localStorage.removeItem("session_id");
            removeSession(storedSessionId);
          }
          setSession(null);
          setUser(null);
          console.log("ExtensionAuthProvider: No active session in storage");
        }
      } catch (error) {
        console.warn("ExtensionAuthProvider: Error checking session (extension mode):", error);
        // Clear any pending timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // In extension mode, continue without authentication but check localStorage for cached session
        try {
          const cachedSessionData = localStorage.getItem('sb-qclvzjiyglvxtctauyhb-auth-token');
          if (cachedSessionData) {
            const parsedData = JSON.parse(cachedSessionData);
            if (parsedData?.user && parsedData?.access_token) {
              console.log("ExtensionAuthProvider: Using cached session data");
              setUser(parsedData.user);
              setSession(parsedData);
            }
          }
        } catch (cacheError) {
          console.warn("ExtensionAuthProvider: Error reading cached session:", cacheError);
        }

        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("ExtensionAuthProvider: Initial load complete");
        }
      }
    };

    initSession();

    // In extension mode, don't set up auth state listener to avoid WebSocket connections
    console.log("ExtensionAuthProvider: Skipping auth state listener for extension mode");

    return () => {
      console.log("ExtensionAuthProvider: Cleaning up");
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [supabase]);

  const signIn = async (provider: "google") => {
    if (!supabase) {
      console.warn("ExtensionAuthProvider: Sign in not available in offline mode");
      throw new Error("Authentication not available in offline mode");
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          skipBrowserRedirect: false,
        },
      });
      if (error) {
        console.error("Error signing in:", error);
        throw error;
      }
    } catch (error) {
      console.error("ExtensionAuthProvider: Sign in failed:", error);
      // For extension mode, we might want to open a new tab for authentication
      if (error instanceof Error && error.message.includes('Connection')) {
        throw new Error("Network connection required for authentication. Please check your internet connection and try again.");
      }
      throw error;
    }
  };

  const signOut = async () => {
    // Clean up stored session first (always works)
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
      removeSession(sessionId);
      localStorage.removeItem("session_id");
    }

    // Clear all cached session data
    try {
      localStorage.removeItem('sb-qclvzjiyglvxtctauyhb-auth-token');
    } catch (error) {
      console.warn("Error clearing cached session data:", error);
    }

    // Clear component state immediately
    setSession(null);
    setUser(null);

    if (!supabase) {
      console.warn("ExtensionAuthProvider: Sign out completed (offline mode)");
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase:", error);
        // Don't throw error since local cleanup already succeeded
        console.warn("Local sign out completed despite Supabase error");
      }
    } catch (error) {
      console.error("ExtensionAuthProvider: Sign out failed:", error);
      // Don't throw error since local cleanup already succeeded
      console.warn("Local sign out completed despite network error");
    }
  };

  const value = {
    user,
    session,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}