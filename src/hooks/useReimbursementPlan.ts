import { useQuery } from "@tanstack/react-query";
import { ProposalDatabase } from "@/@types";

/**
 * Hook for fetching reimbursement plan data
 */
export function useReimbursementPlan() {
  return useQuery<ProposalDatabase, Error>({
    queryKey: ["reimbursement-plan"],
    queryFn: async () => {
      const response = await fetch(
        "/api/subscriber/pdf/reimbursement-plan-form",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch reimbursement plan: ${response.statusText}`
        );
      }

      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
