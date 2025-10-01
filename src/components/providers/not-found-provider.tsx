"use client";

import React, { createContext, useContext, useState } from "react";

const NotFoundContext = createContext<
  | {
      isNotFoundPage: boolean;
      setIsNotFoundPage: (isNotFoundPage: boolean) => void;
    }
  | undefined
>(undefined);

export function NotFoundProvider({ children }: { children: React.ReactNode }) {
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);
  return (
    <NotFoundContext.Provider value={{ isNotFoundPage, setIsNotFoundPage }}>
      {children}
    </NotFoundContext.Provider>
  );
}

export function useIsNotFoundPage() {
  const ctx = useContext(NotFoundContext);
  if (!ctx) {
    throw new Error("useIsNotFoundPage must be used within a NotFoundProvider");
  }

  return ctx;
}
