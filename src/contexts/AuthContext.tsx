"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, UseAuthReturn } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};

// Export individual hooks for convenience
export const useUser = () => {
  const { user, loading } = useAuthContext();
  return { user, loading };
};

export const useSession = () => {
  const { session, loading } = useAuthContext();
  return { session, loading };
};

export const useAuthActions = () => {
  const { signUp, signIn, signOut, resetPassword, refreshSession } =
    useAuthContext();
  return { signUp, signIn, signOut, resetPassword, refreshSession };
};

export const useAuthError = () => {
  const { error } = useAuthContext();
  return error;
};
