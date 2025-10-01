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

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    const initializeAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setError(error);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        if (mounted) {
          setError(err as AuthError);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);
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
      const result = await supabase.auth.signUp({
        email,
        password,
      });

      if (result.error) {
        setError(result.error);
      }
      if (result.data.user) {
        await supabase
          .from("user_profile")
          .insert([{ user_id: result.data.user.id }]);
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

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
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

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await supabase.auth.signOut();

      if (result.error) {
        setError(result.error);
      } else {
        // Clear state immediately on successful sign out
        setUser(null);
        setSession(null);
      }

      return result;
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
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        setError(error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
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
