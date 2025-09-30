import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseTaxPacketOptions {
  selectedYear?: string;
}

interface TaxPacketResponse {
  success: boolean;
  data: {
    pdfPath: string;
    csvLink: string;
    eventsArray: unknown[];
  } | null;
  error: string | null;
}

interface SendPacketParams {
  email: string;
  ccOwnEmail: boolean;
}

export function useTaxPacket({ selectedYear = "2025" }: UseTaxPacketOptions = {}) {
  const queryClient = useQueryClient();

  // Preview mutation
  const previewMutation = useMutation<TaxPacketResponse, Error>({
    mutationFn: async () => {
      const response = await fetch(
        `/api/subscriber/pdf/tax-packet-preview?selected_year=${selectedYear}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate preview");
      }

      if (!data.success || !data.data?.pdfPath) {
        throw new Error(data.error || "Failed to generate preview");
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Generating tax packet preview...", {
        id: "preview-loading",
        description: "This may take a few moments",
      });
    },
    onSuccess: (data) => {
      toast.dismiss("preview-loading");
      toast.success("Tax packet preview generated successfully!", {
        description: "Opening preview in new tab",
      });

      // Open PDF in new tab
      if (data.data?.pdfPath) {
        window.open(data.data.pdfPath, "_blank");
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tax-packet", selectedYear] });
    },
    onError: (error) => {
      toast.dismiss("preview-loading");
      toast.error("Failed to generate preview", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  // Send packet mutation
  const sendMutation = useMutation<TaxPacketResponse, Error, SendPacketParams>({
    mutationFn: async ({ email, ccOwnEmail }) => {
      // Validate email before proceeding
      if (!email.trim()) {
        throw new Error("Email is required");
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error("Invalid email format");
      }

      const response = await fetch(
        "/api/subscriber/pdf/send-tax-packet-to-accountant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            selected_year: selectedYear,
            is_send_to_self: ccOwnEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send tax packet");
      }

      if (!data.success || !data.data?.pdfPath) {
        throw new Error(data.error || "Failed to send tax packet");
      }

      return data;
    },
    onMutate: () => {
      toast.loading("Sending tax packet...", {
        id: "send-loading",
        description: "Please wait while we send your packet",
      });
    },
    onSuccess: (data, variables) => {
      toast.dismiss("send-loading");
      toast.success("Tax packet sent successfully!", {
        description: `Your tax packet has been sent to ${variables.email}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tax-packet", selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["sent-packets"] });
    },
    onError: (error) => {
      toast.dismiss("send-loading");
      toast.error("Failed to send packet", {
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  return {
    // Preview
    generatePreview: previewMutation.mutate,
    generatePreviewAsync: previewMutation.mutateAsync,
    isLoadingPreview: previewMutation.isPending,
    previewError: previewMutation.error,

    // Send
    sendPacket: (email: string, ccOwnEmail: boolean = false) =>
      sendMutation.mutate({ email, ccOwnEmail }),
    sendPacketAsync: (email: string, ccOwnEmail: boolean = false) =>
      sendMutation.mutateAsync({ email, ccOwnEmail }),
    isLoadingSend: sendMutation.isPending,
    sendError: sendMutation.error,

    // Combined states
    isAnyLoading: previewMutation.isPending || sendMutation.isPending,
  };
}
