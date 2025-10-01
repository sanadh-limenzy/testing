"use client";

import { useState, useEffect } from "react";
import { User, Session, AuthError, WeakPassword } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { env } from "@/env";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  signUp: (
    email: string,
    password: string
  ) => Promise<
    | {
        data: {
          user: User | null;
          session: Session | null;
        };
        error: null;
      }
    | {
        data: {
          user: null;
          session: null;
        };
        error: AuthError;
      }
    | {
        data: null;
        error: AuthError;
      }
  >;
  signIn: (
    email: string,
    password: string
  ) => Promise<
    | {
        data: {
          user: User;
          session: Session;
          weakPassword?: WeakPassword | undefined;
        };
        error: null;
      }
    | {
        data: {
          user: null;
          session: null;
          weakPassword?: null | undefined;
        };
        error: AuthError;
      }
    | {
        data: null;
        error: AuthError;
      }
  >;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<
    | {
        data: unknown;
        error: null;
      }
    | {
        data: null;
        error: AuthError;
      }
  >;
  refreshSession: () => Promise<void>;
}

export interface UseAuthReturn extends AuthState, AuthActions {}

interface SessionResponse {
  success: boolean;
  data?: {
    user: User;
    session: Session;
    profile?: unknown;
  };
}

// Global session initialization state to prevent duplicate calls
let initPromise: Promise<SessionResponse | null> | null = null;
let isGloballyInitialized = false;

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // If already initialized globally, skip
      if (isGloballyInitialized) {
        setLoading(false);
        return;
      }

      // If a request is already in flight, wait for it
      if (initPromise) {
        try {
          const result = await initPromise;
          if (mounted && result?.success && result.data) {
            setSession(result.data.session);
            setUser(result.data.user);
          }
          if (mounted) setLoading(false);
        } catch (err) {
          if (mounted) {
            setError(err as AuthError);
            setLoading(false);
          }
        }
        return;
      }

      // Start new initialization request
      initPromise = fetch("/api/auth/session")
        .then(async (response) => {
          if (response.ok) {
            const result = await response.json();
            isGloballyInitialized = true;
            return result;
          }
          isGloballyInitialized = true;
          return null;
        })
        .catch((err) => {
          console.error("Error initializing auth:", err);
          isGloballyInitialized = true;
          throw err;
        });

      try {
        const result = await initPromise;
        if (mounted && result?.success && result.data) {
          setSession(result.data.session);
          setUser(result.data.user);
        }
        if (mounted) setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err as AuthError);
          setLoading(false);
        }
      } finally {
        // Clear the promise after completion
        initPromise = null;
      }
    };

    initializeAuth();

    // Only listen for token refresh events (not sign in/out since we handle those via backend)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Only handle token refresh to keep session alive
      if (event === "TOKEN_REFRESHED") {
        if (session) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          setSession(session);
          setUser(user);
        }
      }
      // Handle signed out event from other tabs/windows
      else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auth actions
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Backend route handles authentication and sets user_role cookie
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        const error = { message: result.error, name: "AuthError" } as AuthError;
        setError(error);
        return {
          data: { user: null, session: null },
          error,
        };
      }

      // Format response to match Supabase format
      const formattedResult = {
        data: {
          user: result.data?.user || null,
          session: result.data?.session || null,
        },
        error: null,
      };

      // Manually update state since we're not relying on onAuthStateChange for sign in/up
      if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.user);
      }

      return formattedResult;
    } catch (err) {
      const error = err as AuthError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Backend route handles authentication and sets user_role cookie
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        const error = { message: result.error, name: "AuthError" } as AuthError;
        setError(error);
        return {
          data: { user: null, session: null },
          error,
        };
      }

      // Format response to match Supabase format
      const formattedResult = {
        data: {
          user: result.data?.user || null,
          session: result.data?.session || null,
        },
        error: null,
      };

      // Manually update state since we're not relying on onAuthStateChange for sign in/up
      if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.user);
      }

      return formattedResult;
    } catch (err) {
      const error = err as AuthError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        const error = { message: result.error, name: "AuthError" } as AuthError;
        setError(error);
        return { error };
      }

      // Clear state immediately on successful sign out
      setUser(null);
      setSession(null);

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      setError(error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const error = err as AuthError;
      setError(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/session");

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSession(result.data.session);
          setUser(result.data.user);
        }
      } else {
        const result = await response.json();
        const error = { message: result.error, name: "AuthError" } as AuthError;
        setError(error);
      }
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    user,
    session,
    loading,
    error,
    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
  };
};
