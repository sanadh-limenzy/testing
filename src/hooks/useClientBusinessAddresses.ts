import { useQuery } from "@tanstack/react-query";

interface BusinessAddress {
  id: string;
  business_name?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_default?: boolean;
}

interface BusinessAddressesResponse {
  success: boolean;
  data: BusinessAddress[];
}

export function useClientBusinessAddresses(clientId: string, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery<BusinessAddressesResponse>({
    queryKey: ["client-business-addresses", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/business-addresses`);
      if (!response.ok) {
        throw new Error("Failed to fetch business addresses");
      }
      return response.json();
    },
    enabled,
  });

  return {
    businessAddresses: data?.data || [],
    isLoading,
    error,
    refetch,
  };
}

