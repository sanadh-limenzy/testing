import { useQuery } from "@tanstack/react-query";
import { ProposalDatabase } from "@/@types";

/**
 * Hook for fetching rental agreement data
 */
export function useRentalAgreement(
  eventId: string,
  useSystemGenerated?: boolean
) {
  return useQuery<ProposalDatabase, Error>({
    queryKey: ["rental-agreement", eventId, useSystemGenerated],
    queryFn: async () => {
      const response = await fetch(
        "/api/subscriber/pdf/rental-agreement-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventId,
            use_system_generated: useSystemGenerated,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch rental agreement: ${response.statusText}`
        );
      }

      return response.json();
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
