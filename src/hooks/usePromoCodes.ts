import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PromoCodeDatabase } from "@/@types";

interface PromoCodeFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface CreatePromoCodeData {
  name: string;
  code: string;
  promo_type: "All" | "Individual";
  is_flat_discount: boolean;
  discount_amount?: number;
  discount_percent?: number;
  start_at: string;
  expire_at?: string | null;
  is_delete_after_use: boolean;
  is_one_time_user: boolean;
  is_unlimited_promo: boolean;
  promo_for: string[];
  allowed_emails: string[];
}

interface PromoCodesResponse {
  success: boolean;
  data: (PromoCodeDatabase & {
    formatted_start_date: string;
    formatted_end_date: string;
  })[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function usePromoCodes(filters: PromoCodeFilters = {}) {
  const {
    page = 1,
    limit = 15,
    status = "all",
    search = "",
  } = filters;

  return useQuery<PromoCodesResponse>({
    queryKey: ["promoCodes", page, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        search,
      });

      const response = await fetch(`/api/admin/promo-codes?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePromoCodeData) => {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create promo code');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch promo codes list
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
      queryClient.cancelQueries({ queryKey: ["promoCodes"] });
      queryClient.refetchQueries({ queryKey: ["promoCodes"] });
    },
  });
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePromoCodeData> }) => {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update promo code');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch promo codes list
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
      queryClient.cancelQueries({ queryKey: ["promoCodes"] });
      queryClient.refetchQueries({ queryKey: ["promoCodes"] });
    },
  });
}

export function useDeletePromoCode(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete promo code');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch promo codes list
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
      queryClient.cancelQueries({ queryKey: ["promoCodes"] });
      queryClient.refetchQueries({ queryKey: ["promoCodes"] });
    },
    onMutate: () => {
      const previousPromoCodes = queryClient.getQueryData<PromoCodesResponse>(["promoCodes"]);
      queryClient.setQueryData<PromoCodesResponse>(["promoCodes"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((promoCode) => promoCode.id !== id),
        };
      });
      return { previousPromoCodes };
    }
  });
}

export function useTogglePromoCodeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/promo-codes/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle promo code status');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch promo codes list
      queryClient.invalidateQueries({ queryKey: ["promoCodes"] });
      queryClient.cancelQueries({ queryKey: ["promoCodes"] });
      queryClient.refetchQueries({ queryKey: ["promoCodes"] });
    },
  });
}
