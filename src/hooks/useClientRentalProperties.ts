import { useQuery } from "@tanstack/react-query";

interface RentalProperty {
  id: string;
  nickname?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  bedrooms?: number;
  is_default?: boolean;
}

interface RentalPropertiesResponse {
  success: boolean;
  data: RentalProperty[];
}

export function useClientRentalProperties(clientId: string, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery<RentalPropertiesResponse>({
    queryKey: ["client-rental-properties", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${clientId}/rental-properties`);
      if (!response.ok) {
        throw new Error("Failed to fetch rental properties");
      }
      return response.json();
    },
    enabled,
  });

  return {
    rentalProperties: data?.data || [],
    isLoading,
    error,
    refetch,
  };
}

