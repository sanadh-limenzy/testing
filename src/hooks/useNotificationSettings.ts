import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserNotificationSettings } from "@/@types";

// Fetch notification settings
export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: async (): Promise<UserNotificationSettings> => {
      const response = await fetch("/api/subscriber/notifications/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch notification settings");
      }
      const data = await response.json();
      return data.data;
    },
  });
}

// Update notification settings
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserNotificationSettings>) => {
      const response = await fetch("/api/subscriber/notifications/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to update notification settings"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notification settings
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}

// Reset notification settings to default
export function useResetNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/subscriber/notifications/reset", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset notification settings");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notification settings
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}
