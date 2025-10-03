import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";
import {
  CustomPlan,
  CustomPlansResponse,
  UseCustomPlansParams,
  Residence
} from "../@types/custom-plans";

/**
 * Fetch function for custom plans API
 */
const fetchCustomPlans = async (params: UseCustomPlansParams): Promise<CustomPlansResponse> => {
  const { page = 1, filters } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "15",
    ...(filters?.status && filters.status !== "all" && { status: filters.status }),
    ...(filters?.search && { search: filters.search }),
  });

  const response = await fetch(`/api/admin/custom-plans?${queryParams.toString()}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 403) {
      throw new Error("Forbidden");
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch custom plans: ${response.status} - ${errorText}`);
  }

  return response.json();
};

/**
 * Custom hook for fetching custom plans with search and filter functionality
 * Follows the same pattern as useClients hook
 */
export function useCustomPlans({ 
  page = 1, 
  filters, 
  enabled = true 
}: UseCustomPlansParams = {}) {
  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(filters?.search || "", 300);
  
  // Create debounced filters object
  const debouncedFilters = filters ? {
    ...filters,
    search: debouncedSearch
  } : undefined;

  // Create a stable query key by serializing the filters object
  const queryKey = ["custom-plans", page, debouncedFilters ? {
    status: debouncedFilters.status,
    search: debouncedFilters.search,
  } : null];

  return useQuery<CustomPlansResponse, Error>({
    queryKey,
    queryFn: () => fetchCustomPlans({ page, filters: debouncedFilters }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for fetching a single custom plan by ID
 */
export function useCustomPlan(id: string) {
  return useQuery<{ success: boolean; data: CustomPlan }, Error>({
    queryKey: ["custom-plan", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/custom-plans/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Custom plan not found");
        }
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        if (response.status === 403) {
          throw new Error("Forbidden");
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch custom plan: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for updating custom plan status
 */
export function useUpdateCustomPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { customPlanId: string; status: "ACTIVE" | "INACTIVE" }
  >({
    mutationFn: async ({ customPlanId, status }) => {
      const response = await fetch(`/api/admin/custom-plans/${customPlanId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update custom plan status: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch custom plans list
      queryClient.invalidateQueries({ queryKey: ["custom-plans"] });
      
      // Update the specific custom plan in cache
      queryClient.setQueryData(["custom-plan", variables.customPlanId], (oldData: { success: boolean; data: CustomPlan } | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              status: variables.status,
            }
          };
        }
        return oldData;
      });
    },
  });
}

/**
 * Hook for creating a new custom plan
 */
export function useCreateCustomPlan() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: CustomPlan },
    Error,
    Partial<CustomPlan>
  >({
    mutationFn: async (customPlanData) => {
      const response = await fetch("/api/admin/custom-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customPlanData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create custom plan: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch custom plans list
      queryClient.invalidateQueries({ queryKey: ["custom-plans"] });
    },
  });
}

/**
 * Hook for deleting a custom plan
 */
export function useDeleteCustomPlan() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    string
  >({
    mutationFn: async (customPlanId) => {
      const response = await fetch(`/api/admin/custom-plans/${customPlanId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete custom plan: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch custom plans list
      queryClient.invalidateQueries({ queryKey: ["custom-plans"] });
    },
  });
}

/**
 * Utility function to get filter options for custom plans
 */
export const getCustomPlanFilterOptions = () => {
  return {
    status: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ] as const,
  };
};

/**
 * Hook for fetching residences by custom plan ID
 */
export function useCustomPlanResidences(customPlanId: string, enabled: boolean = false) {
  return useQuery<{ success: boolean; data: Residence[] }, Error>({
    queryKey: ["custom-plan-residences", customPlanId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/custom-plans/${customPlanId}/residences`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Residences not found");
        }
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        if (response.status === 403) {
          throw new Error("Forbidden");
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch residences: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    enabled: enabled && !!customPlanId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}