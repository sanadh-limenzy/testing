import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { EventDatabaseWithAllData } from "@/@types/index";

interface EventsResponse {
  success: boolean;
  data: EventDatabaseWithAllData[];
  error?: string;
}

async function fetchClientEvents(userId: string): Promise<EventDatabaseWithAllData[]> {
  const response = await fetch(`/api/admin/clients/${userId}/events`);
  const data: EventsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch events");
  }

  return data.data || [];
}

export function useClientEvents(userId: string, shouldFetch: boolean = false) {
  const query = useQuery({
    queryKey: ["admin-clients", userId, "events"],
    queryFn: () => fetchClientEvents(userId),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle errors with toast notifications
  useEffect(() => {
    if (query.isError && query.error) {
      console.error("Error fetching events:", query.error);
      toast.error(
        query.error instanceof Error
          ? query.error.message
          : "Failed to fetch events"
      );
    }
  }, [query.isError, query.error]);

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

