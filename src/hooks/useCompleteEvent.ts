import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CompleteEventResponse {
  success: boolean;
  message: string;
}

export const useCompleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation<CompleteEventResponse, Error, string>({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete event");
      }

      return response.json();
    },
    onSuccess: (data, eventId) => {
      toast.success(data.message);

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({
        queryKey: ["events-per-rental-address"],
      });
      queryClient.invalidateQueries({
        queryKey: ["events-from-business-address"],
      });
      queryClient.cancelQueries({ queryKey: ["events-from-rental-address"] });
      queryClient.cancelQueries({ queryKey: ["events-from-business-address"] });
      queryClient.refetchQueries({ queryKey: ["events-from-rental-address"] });
      queryClient.refetchQueries({
        queryKey: ["events-from-business-address"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-clients", "events"] });
      queryClient.cancelQueries({ queryKey: ["admin-clients", "events"] });
      queryClient.refetchQueries({ queryKey: ["admin-clients", "events"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
