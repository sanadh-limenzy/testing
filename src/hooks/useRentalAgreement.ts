import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

/**
 * Hook for switching to system generated rental agreement
 */
export function useSwitchToSystemGenerated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string): Promise<{ proposal: ProposalDatabase; success: boolean }> => {
      const response = await fetch(
        "/api/subscriber/pdf/rental-agreement-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventId,
            use_system_generated: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to switch to system generated agreement: ${response.statusText}`
        );
      }

      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({
        queryKey: ["rental-agreement", eventId],
      });
      
      queryClient.refetchQueries({
        queryKey: ["rental-agreement", eventId],
      });
    },
    onError: (error) => {
      console.error("Error switching to system generated agreement:", error);
    },
  });
}
