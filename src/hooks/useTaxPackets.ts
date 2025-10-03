import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { TaxPacket } from "@/components/admin/clients/TaxPacketTab";

interface TaxPacketsResponse {
  success: boolean;
  data: TaxPacket[];
  error?: string;
}

async function fetchTaxPackets(userId: string): Promise<TaxPacket[]> {
  const response = await fetch(`/api/admin/clients/${userId}/tax-packets`);
  const data: TaxPacketsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch tax packets");
  }

  return data.data || [];
}

export function useTaxPackets(userId: string, shouldFetch: boolean = false) {
  const query = useQuery({
    queryKey: ["admin", "clients", userId, "tax-packets"],
    queryFn: () => fetchTaxPackets(userId),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle errors with toast notifications
  useEffect(() => {
    if (query.isError && query.error) {
      console.error("Error fetching tax packets:", query.error);
      toast.error(
        query.error instanceof Error
          ? query.error.message
          : "Failed to fetch tax packets"
      );
    }
  }, [query.isError, query.error]);

  return {
    taxPackets: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
