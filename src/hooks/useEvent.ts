import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventFormData } from "@/@types/validation";
import {
  EventDatabaseWithAllData,
  EventDatabase,
  FutureDailyPricingDay,
  UserAddress,
} from "@/@types/index";

export interface EventResponse {
  success: boolean;
  data: EventDatabaseWithAllData;
}

/**
 * Hook to fetch event data by ID
 */
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async (): Promise<EventResponse> => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const response = await fetch(`/api/events/${eventId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch event");
      }

      return response.json();
    },
    enabled: !!eventId,
    refetchInterval: false,
  });
}

/**
 * Hook to update event data
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventData,
    }: {
      eventId: string;
      eventData: EventFormData;
    }) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event: eventData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch event data
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.cancelQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.cancelQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["rental-property"] });
      queryClient.cancelQueries({ queryKey: ["rental-property"] });
      queryClient.invalidateQueries({
        queryKey: ["events-from-rental-address"],
      });
      queryClient.cancelQueries({ queryKey: ["events-from-rental-address"] });
      queryClient.invalidateQueries({ queryKey: ["rental-agreement"] });
      queryClient.cancelQueries({ queryKey: ["rental-agreement"] });
    },
  });
}

/**
 * Hook to delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.cancelQueries({ queryKey: ["events"] });
      queryClient.refetchQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["rental-property"] });
      queryClient.cancelQueries({ queryKey: ["rental-property"] });
      queryClient.refetchQueries({ queryKey: ["rental-property"] });
      queryClient.invalidateQueries({
        queryKey: ["events-from-rental-address"],
      });
      queryClient.cancelQueries({ queryKey: ["events-from-rental-address"] });
      queryClient.refetchQueries({ queryKey: ["events-from-rental-address"] });
    },
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });

      const previousEvents = queryClient.getQueryData<EventsResponse>([
        "events",
      ]);

      queryClient.setQueryData<EventsResponse>(["events"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((event) => event.id !== eventId),
        };
      });

      queryClient.setQueryData<{ data: EventDatabase[] }>(
        ["events-from-rental-address"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((event) => event.id !== eventId),
          };
        }
      );

      return { previousEvents };
    },
  });
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      eventData: EventFormData
    ): Promise<CreateEventResponse> => {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event: eventData }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to create event";

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const result: CreateEventResponse = await response.json();

        if (!result.success || result.error) {
          throw new Error(result.error || "Failed to create event");
        }

        return result;
      } catch (error) {
        console.error("Error creating event:", error);

        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "An unexpected error occurred while creating the event"
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({
        queryKey: ["events-from-rental-address"],
      });
      queryClient.invalidateQueries({ queryKey: ["rental-property"] });
      queryClient.cancelQueries({ queryKey: ["events"] });
      queryClient.cancelQueries({ queryKey: ["events-from-rental-address"] });
      queryClient.cancelQueries({ queryKey: ["rental-property"] });
    },
    onError: (error) => {
      console.error("Event creation failed:", error);
    },
  });
}

export function useEventsFromRentalAddress(
  rentalAddressId: string | undefined
) {
  return useQuery({
    queryKey: ["events-from-rental-address", rentalAddressId],
    queryFn: async (): Promise<{ data: EventDatabase[] }> => {
      if (!rentalAddressId) {
        throw new Error("Rental address ID is required");
      }

      try {
        const response = await fetch(`/api/events/rental/${rentalAddressId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch events from rental address";

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const result: { data: EventDatabase[] } = await response.json();

        return result;
      } catch (error) {
        console.error("Error fetching events from rental address:", error);

        if (error instanceof Error) {
          throw error;
        }

        throw new Error("An unexpected error occurred while fetching events");
      }
    },
    enabled: !!rentalAddressId,
    refetchInterval: false,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error instanceof Error &&
        error.message.includes("not authenticated")
      ) {
        return false;
      }

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

interface CreateEventResponse {
  success: boolean;
  data?: EventDatabase;
  error?: string;
  message?: string;
}

export function useRentalAmounts(addressId: string | undefined) {
  return useQuery<FutureDailyPricingDay[] | null>({
    queryKey: ["rental-amounts", addressId],
    queryFn: async () => {
      if (!addressId) return null;

      const response = await fetch(
        `/api/subscriber/address/rental-amounts?rental_address_id=${addressId}`,
        {
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch rental amounts:",
          response.status,
          response.statusText
        );
        return null;
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!addressId,
    placeholderData: [],
  });
}

export function useBusinessAddress() {
  return useQuery<UserAddress | null>({
    queryKey: ["business-address"],
    queryFn: async () => {
      const response = await fetch(`/api/subscriber/address/business/default`, {
        cache: "no-cache",
      });

      if (!response.ok) {
        console.error(
          "Failed to fetch business address:",
          response.status,
          response.statusText
        );
        return null;
      }

      const result = await response.json();
      return result.data;
    },
  });
}

interface AddressWithCustomPlan extends UserAddress {
  is_custom_plan: boolean;
  avarage_value: number;
}

export function useAddress(addressId: string | undefined) {
  return useQuery<AddressWithCustomPlan | null>({
    queryKey: ["address", addressId],
    queryFn: async () => {
      if (!addressId) return null;

      const response = await fetch(
        `/api/subscriber/address/rental/${addressId}`,
        {
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch address:",
          response.status,
          response.statusText
        );
        return null;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        return null;
      }

      return result.data;
    },
    enabled: !!addressId,
  });
}

interface EventsResponse {
  success: boolean;
  data: EventDatabaseWithAllData[];
}

export function useEventsPerRentalAddress(
  selectedResidence: string | undefined
) {
  return useQuery<EventsResponse>({
    queryKey: ["events", selectedResidence],
    queryFn: async () => {
      if (!selectedResidence) {
        return { success: true, data: [] };
      }

      const response = await fetch(
        `/api/events?rental_address_id=${selectedResidence}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch events");
      }
      return response.json();
    },
    enabled: !!selectedResidence,
  });
}
