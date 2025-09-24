import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChangePasswordData {
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

interface ChangePasswordError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export const useChangePassword = () => {
  return useMutation<
    ChangePasswordResponse,
    ChangePasswordError,
    ChangePasswordData
  >({
    mutationFn: async (formData: ChangePasswordData) => {
      const response = await fetch("/api/subscriber/profile/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onError: (error: ChangePasswordError) => {
      console.log("Failed to change password:", error);
      toast.error(error.error);
    },
  });
};
