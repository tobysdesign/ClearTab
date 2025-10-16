"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  console.log("SupabaseAuthProvider: Component rendering");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => {
    console.log("SupabaseAuthProvider: Creating Supabase client");
    return createClient();
  });

  useEffect(() => {
    console.log("SupabaseAuthProvider: useEffect triggered!");

    if (!supabase) {
      console.error("SupabaseAuthProvider: No supabase client!");
      setLoading(false);
      return;
    }

    let mounted = true;

    // Initialize session immediately from storage (fast, synchronous check)
    const initSession = async () => {
      console.log(
        "SupabaseAuthProvider: Checking for existing session in storage",
      );

      try {
        // Quick check for session in storage without waiting for network
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log("SupabaseAuthProvider: Session check result:", {
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
          console.log("SupabaseAuthProvider: User set:", session.user.email);
        } else {
          // No active session
          const storedSessionId = localStorage.getItem("session_id");
          if (storedSessionId) {
            localStorage.removeItem("session_id");
            removeSession(storedSessionId);
          }
          setSession(null);
          setUser(null);
          console.log("SupabaseAuthProvider: No active session in storage");
        }
      } catch (error) {
        console.error("SupabaseAuthProvider: Error checking session:", error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("SupabaseAuthProvider: Initial load complete");
        }
      }
    };

    initSession();

    // Listen for auth changes (handles OAuth redirects and sign in/out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("SupabaseAuthProvider: Auth state changed:", event);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create user record on sign in if it doesn't exist
      if (event === "SIGNED_IN" && session?.user) {
        // Generate and store session ID
        const sessionId = crypto.randomUUID();
        localStorage.setItem("session_id", sessionId);
        storeSession(sessionId, session.user, session);

        console.log("SIGNED_IN event - Session stored with ID:", sessionId);

        // User creation/update is now handled by the auth callback API route
        // This avoids direct database access from the client
        console.log("User authentication complete, redirecting...");

        // Redirect to main page when user signs in
        if (window.location.pathname === "/login") {
          window.location.href = "/";
        }
      }
    });

    return () => {
      console.log("SupabaseAuthProvider: Cleaning up subscription");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]); // Include supabase in dependency array

  const signIn = async (provider: "google") => {
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
  };

  const signOut = async () => {
    // Clean up stored session
    const sessionId = localStorage.getItem("session_id");
    if (sessionId) {
      removeSession(sessionId);
      localStorage.removeItem("session_id");
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
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
