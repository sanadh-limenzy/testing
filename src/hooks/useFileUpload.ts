import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadedFile } from "@/lib/s3-utils";

interface UploadResponse {
  success: boolean;
  data?: {
    uploadedFiles: UploadedFile[];
  };
  error?: string;
  details?: {
    successful: UploadedFile[];
    failed: string[];
  };
}

interface UploadFilesParams {
  files: File[];
  folder?: string;
}

/**
 * Hook for uploading files to S3 with progress tracking and toast notifications
 */
export function useFileUpload() {
  return useMutation<UploadResponse, Error, UploadFilesParams>({
    mutationFn: async ({ files, folder = "uploads" }) => {
      return new Promise<UploadResponse>((resolve, reject) => {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("folder", folder);

        const xhr = new XMLHttpRequest();

        // Show initial toast with file names
        const fileNames = files.map((file) => file.name).join(", ");
        const toastId = toast.loading(
          `Uploading ${
            files.length > 1 ? `${files.length} files` : fileNames
          }...`,
          {
            description: "0% complete",
          }
        );

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );

            // Update toast with progress
            toast.loading(
              `Uploading ${
                files.length > 1 ? `${files.length} files` : fileNames
              }...`,
              {
                id: toastId,
                description: `${percentComplete}% complete`,
              }
            );
          }
        });

        // Handle successful upload
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);

              // Show success toast
              toast.success("Upload completed successfully!", {
                id: toastId,
                description: `${
                  files.length > 1 ? `${files.length} files` : fileNames
                } uploaded`,
              });

              resolve(response);
            } catch (error) {
              console.error("Error parsing server response:", error);
              toast.error("Upload failed", {
                id: toastId,
                description: "Failed to parse server response",
              });
              reject(new Error("Failed to parse server response"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              toast.error("Upload failed", {
                id: toastId,
                description: errorData.error || "Unknown error occurred",
              });
              reject(new Error(errorData.error || "Upload failed"));
            } catch (error) {
              console.error("Error parsing server error:", error);
              toast.error("Upload failed", {
                id: toastId,
                description: `Server error: ${xhr.status}`,
              });
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        // Handle upload errors
        xhr.addEventListener("error", () => {
          toast.error("Upload failed", {
            id: toastId,
            description: "Network error occurred",
          });
          reject(new Error("Network error during upload"));
        });

        // Handle upload abort
        xhr.addEventListener("abort", () => {
          toast.error("Upload cancelled", {
            id: toastId,
            description: "Upload was cancelled",
          });
          reject(new Error("Upload was cancelled"));
        });

        // Start the upload
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    },
  });
}
