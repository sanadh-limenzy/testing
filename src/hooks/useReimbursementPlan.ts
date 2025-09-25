import { useQuery } from "@tanstack/react-query";
import { ProposalDatabase } from "@/@types";

/**
 * Hook for fetching reimbursement plan data
 */
export function useReimbursementPlan(business_address_id?: string) {
  return useQuery<{ data: ProposalDatabase; success: boolean }, Error>({
    queryKey: ["reimbursement-plan", business_address_id],
    queryFn: async () => {
      const url = business_address_id
        ? `/api/subscriber/pdf/reimbursement-plan-form?business_address_id=${business_address_id}`
        : "/api/subscriber/pdf/reimbursement-plan-form";

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { env } from "@/env";
import { useFileUpload } from "./useFileUpload";

interface SignReimbursementPlanParams {
  business_signature: string;
  proposal_id: string;
  business_address_id: string;
  access_token: string;
}

interface ManualReimbursementPlanParams {
  file: File;
  access_token: string;
}

interface ResetReimbursementPlanParams {
  access_token: string;
}

/**
 * Hook for signing reimbursement plan
 */
export function useSignReimbursementPlan() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      business_signature,
      proposal_id,
      business_address_id,
      access_token,
    }: SignReimbursementPlanParams) => {
      const response = await fetch(
        `${env.NEXT_PUBLIC_APP_URL}/api/subscriber/pdf/sign-reimbursement-plan-form`,
        {
          method: "POST",
          body: JSON.stringify({
            business_signature,
            proposal_id,
            business_address_id,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to submit reimbursement plan: ${response.statusText}`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Reimbursement plan signed successfully!");
      queryClient.invalidateQueries({ queryKey: ["reimbursement-plan"] });
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      queryClient.cancelQueries({ queryKey: ["user-data"] });
      queryClient.cancelQueries({ queryKey: ["reimbursement-plan"] });
      router.push("/subscriber/home");
    },
    onError: (error) => {
      console.error("Error signing reimbursement plan:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while signing the reimbursement plan"
      );
    },
  });
}

/**
 * Hook for uploading manual reimbursement plan
 */
export function useManualReimbursementPlanUpload() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: uploadFiles } = useFileUpload();

  return useMutation({
    mutationFn: async ({
      file,
      access_token,
    }: ManualReimbursementPlanParams) => {
      // First upload the file to S3
      const uploadResult = await uploadFiles({
        files: [file],
        folder: "manual-reimbursement-plans",
      });

      if (!uploadResult.success || !uploadResult.data?.uploadedFiles[0]) {
        throw new Error(uploadResult.error || "File upload failed");
      }

      const uploadedFileData = uploadResult.data.uploadedFiles[0];

      // Then create the manual reimbursement plan record
      const response = await fetch(
        "/api/subscriber/pdf/manual-reimbursement-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            file_url: uploadedFileData.url,
            file_name: uploadedFileData.name,
            file_size: uploadedFileData.size,
            file_type: uploadedFileData.type,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create reimbursement plan record"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Manual reimbursement plan uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["reimbursement-plan"] });
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      router.push("/subscriber/home");
    },
    onError: (error) => {
      console.error("Error uploading manual reimbursement plan:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload reimbursement plan"
      );
    },
  });
}

/**
 * Hook for resetting reimbursement plan to system generated
 */
export function useResetReimbursementPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ access_token }: ResetReimbursementPlanParams) => {
      const response = await fetch(
        "/api/subscriber/pdf/reset-reimbursement-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to reset reimbursement plan"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Reimbursement plan reset to system generated!");
      queryClient.invalidateQueries({ queryKey: ["reimbursement-plan"] });
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
    },
    onError: (error) => {
      console.error("Error resetting reimbursement plan:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reset reimbursement plan"
      );
    },
  });
}
