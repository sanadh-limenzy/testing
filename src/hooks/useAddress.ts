import { UserAddress } from "@/@types";
import { RentalAddress } from "@/@types/subscriber";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useRentalAddress(addressId: string | undefined) {
  return useQuery({
    queryKey: ["rental-address", addressId],
    queryFn: async (): Promise<UserAddress> => {
      if (!addressId) {
        throw new Error("Address ID is required");
      }

      const response = await fetch(`/api/addresses/${addressId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch address");
      }

      return response.json();
    },
    enabled: !!addressId,
    refetchInterval: false,
  });
}

export const useDefaultBusinessAddress = () => {
  return useQuery({
    queryKey: ["business-address-default"],
    queryFn: async (): Promise<UserAddress> => {
      const response = await fetch(`/api/subscriber/address/business/default`);
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Failed to fetch address");
      }
      return result.data;
    },
    refetchInterval: false,
  });
};

export interface RentalPropertiesResponse {
  success: boolean;
  data: RentalAddress[];
  count: number;
}
export interface BusinessAddressesResponse {
  success: boolean;
  data: UserAddress[];
  count: number;
}

export const useRentalProperties = () => {
  return useQuery<RentalPropertiesResponse>({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const response = await fetch("/api/subscriber/address/rental");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rental properties");
      }
      const data: RentalPropertiesResponse = await response.json();
      return data;
    },
  });
};

export const useBusinessAddresses = () => {
  return useQuery<BusinessAddressesResponse>({
    queryKey: ["business-addresses"],
    queryFn: async () => {
      const response = await fetch("/api/subscriber/address/business");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch business addresses"
        );
      }
      const data: BusinessAddressesResponse = await response.json();
      return data;
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addressId, addressType }: { addressId: string; addressType: "rental" | "business" }) => {
      const response = await fetch("/api/subscriber/address/set-default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addressId, addressType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set default address");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Default address set successfully");
      // Invalidate and refetch the appropriate address type
      if (variables.addressType === "rental") {
        queryClient.invalidateQueries({ queryKey: ["rental-properties"] });
        queryClient.invalidateQueries({ queryKey: ["rental-address"] });
      } else if (variables.addressType === "business") {
        queryClient.invalidateQueries({ queryKey: ["business-addresses"] });
        queryClient.invalidateQueries({ queryKey: ["business-address-default"] });
      }
    },
  });
};

// Keep the old hook for backward compatibility
export const useSetDefaultRentalAddress = () => {
  const mutation = useSetDefaultAddress();
  
  return {
    ...mutation,
    mutateAsync: (addressId: string) => mutation.mutateAsync({ addressId, addressType: "rental" }),
  };
};

// Hook specifically for getting rental addresses for selection
export const useRentalAddresses = () => {
  return useQuery<RentalPropertiesResponse>({
    queryKey: ["rental-addresses"],
    queryFn: async () => {
      const response = await fetch("/api/subscriber/address/rental");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch rental addresses"
        );
      }
      const data: RentalPropertiesResponse = await response.json();
      return data;
    },
  });
};

// Hook for updating home office deduction status
export const useUpdateHomeOfficeDeduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      addressId, 
      isHomeOfficeDeduction 
    }: { 
      addressId: string; 
      isHomeOfficeDeduction: boolean 
    }) => {
      const response = await fetch("/api/subscriber/address/home-office-deduction", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addressId, isHomeOfficeDeduction }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update home office deduction status");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Home office deduction status updated successfully");
      // Invalidate and refetch rental properties queries
      queryClient.invalidateQueries({ queryKey: ["rental-properties"] });
      queryClient.invalidateQueries({ queryKey: ["rental-addresses"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update home office deduction status");
    },
  });
};
