import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  currentPlan: string;
  planStatus: "active" | "inactive";
  referredBy: string;
  status: "active" | "inactive";
  businessName?: string;
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
  isSubscriptionActive: boolean;
  planStartDate?: string;
  planEndDate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: PaginationInfo;
}

interface FilterState {
  addedDate: string;
  status: string;
  subscriptionPlan: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface UseClientsParams {
  page?: number;
  filters?: FilterState;
  enabled?: boolean;
}

const fetchClients = async (params: UseClientsParams): Promise<ClientsResponse> => {
  const { page = 1, filters } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "15",
    ...(filters?.addedDate && filters.addedDate !== "all" && { addedDate: filters.addedDate }),
    ...(filters?.status && filters.status !== "all" && { status: filters.status }),
    ...(filters?.subscriptionPlan && filters.subscriptionPlan !== "all" && { subscriptionPlan: filters.subscriptionPlan }),
    ...(filters?.search && { search: filters.search }),
    sortBy: filters?.sortBy || "addedOn",
    sortOrder: filters?.sortOrder || "desc"
  });

  const response = await fetch(`/api/admin/clients?${queryParams.toString()}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 403) {
      throw new Error("Forbidden");
    }
    const errorText = await response.text();
    throw new Error(`Failed to fetch clients: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export function useClients({ page = 1, filters, enabled = true }: UseClientsParams = {}) {
  // Create a stable query key by serializing the filters object
  const queryKey = ["clients", page, filters ? {
    addedDate: filters.addedDate,
    status: filters.status,
    subscriptionPlan: filters.subscriptionPlan,
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  } : null];

  return useQuery<ClientsResponse, Error>({
    queryKey,
    queryFn: () => fetchClients({ page, filters }),
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

export function useClient(id: string) {
  return useQuery<{ success: boolean; data: Client }, Error>({
    queryKey: ["client", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clients/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Client not found");
        }
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        if (response.status === 403) {
          throw new Error("Forbidden");
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch client: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateClientStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { clientId: string; status: "active" | "inactive" }
  >({
    mutationFn: async ({ clientId, status }) => {
      const response = await fetch(`/api/admin/clients/${clientId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update client status: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      // Update the specific client in cache
      queryClient.setQueryData(["client", variables.clientId], (oldData: { success: boolean; data: Client } | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              status: variables.status,
              isActive: variables.status === "active"
            }
          };
        }
        return oldData;
      });
    },
  });
}
