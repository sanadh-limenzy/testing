"use client";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NotFoundProvider } from "./not-found-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(error);
    },
  }),
});
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotFoundProvider>
        <AuthProvider>{children}</AuthProvider>
      </NotFoundProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
