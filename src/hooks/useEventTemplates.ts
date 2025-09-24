import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventTemplateDatabase } from "@/@types";

export interface EventTemplatesResponse {
  success: boolean;
  data: EventTemplateDatabase[];
  error?: string;
}

export interface EventTemplatesParams {
  isTemplate?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Custom hook for fetching event templates.
 *
 * This hook provides a unified interface to access event templates from the API endpoint `/api/event-templates`.
 * It supports filtering by template status and pagination.
 *
 * @param params - Optional parameters for filtering and pagination
 * @example
 * ```tsx
 * function EventTemplatesList() {
 *   const { data, isLoading, error } = useEventTemplates();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return <div>No templates found</div>;
 *
 *   return (
 *     <div>
 *       {data.data.map(template => (
 *         <div key={template.id}>{template.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Get only templates marked as templates with pagination
 * const { data } = useEventTemplates({
 *   isTemplate: true,
 *   limit: 10,
 *   offset: 0
 * });
 * ```
 *
 * @remarks
 * - The hook automatically handles authentication state
 * - Implements retry logic with up to 3 attempts for transient failures
 * - Automatically stops retrying on authentication errors
 * - Uses React Query for caching and background updates
 * - Query key: `["event-templates", params]`
 */
export function useEventTemplates(params?: EventTemplatesParams) {
  return useQuery<EventTemplatesResponse>({
    queryKey: ["event-templates", params],
    queryFn: async (): Promise<EventTemplatesResponse> => {
      try {
        // Build query parameters
        const searchParams = new URLSearchParams();

        if (params?.isTemplate !== undefined) {
          searchParams.append("is_template", params.isTemplate.toString());
        }
        if (params?.limit !== undefined) {
          searchParams.append("limit", params.limit.toString());
        }
        if (params?.offset !== undefined) {
          searchParams.append("offset", params.offset.toString());
        }

        const queryString = searchParams.toString();
        const url = queryString
          ? `/api/event-templates?${queryString}`
          : "/api/event-templates";

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch event templates";

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const result: EventTemplatesResponse = await response.json();

        if (!result.success) {
          throw new Error("Failed to fetch event templates");
        }

        return result;
      } catch (error) {
        console.error("Error fetching event templates:", error);

        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "An unexpected error occurred while fetching event templates"
        );
      }
    },
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
    refetchInterval: false,
  });
}

/**
 * Hook to create a new event template
 */
export function useCreateEventTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: Partial<EventTemplateDatabase>) => {
      const response = await fetch("/api/event-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event template");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch event templates
      queryClient.invalidateQueries({ queryKey: ["event-templates"] });
      queryClient.cancelQueries({ queryKey: ["event-templates"] });
      queryClient.refetchQueries({ queryKey: ["event-templates"] });
    },
  });
}

/**
 * Hook to fetch a specific event template by ID
 */
export function useEventTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ["event-template", templateId],
    queryFn: async (): Promise<{ success: boolean; data: EventTemplateDatabase }> => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(`/api/event-templates/${templateId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch event template");
      }

      return response.json();
    },
    enabled: !!templateId,
    refetchInterval: false,
  });
}

/**
 * Hook to delete an event template
 */
export function useDeleteEventTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/event-templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete event template");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch event templates
      queryClient.invalidateQueries({ queryKey: ["event-templates"] });
      queryClient.cancelQueries({ queryKey: ["event-templates"] });
      queryClient.refetchQueries({ queryKey: ["event-templates"] });
    },
  });
}
