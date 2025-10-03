import { useQuery } from "@tanstack/react-query";
import { PlanDatabase } from "@/@types";

interface UsePlansOptions {
  active?: boolean;
  initialData?: Pick<PlanDatabase, "id" | "plan_type" | "title">[];
}

export function usePlans({ active = true, initialData }: UsePlansOptions = {}) {
  return useQuery({
    queryKey: ["plans", active ? "active" : "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (active) {
        params.set("active", "true");
      }
      
      const response = await fetch(`/api/admin/plans?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      const data = await response.json();
      return data.data || [];
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}