"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Upload, FileText } from "lucide-react";

interface ManualRentalAgreementUploadProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function ManualRentalAgreementUpload({
  eventId,
  onUploadSuccess,
}: ManualRentalAgreementUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileUploadRef = useRef<FileUploadRef>(null);
  const { mutateAsync: uploadFiles } = useFileUpload();
  const { session } = useAuthContext();

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
    } else {
      setUploadedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!session?.access_token) {
      toast.error("Please log in to upload files");
      return;
    }

    setIsUploading(true);

    try {
      // First upload the file to S3
      const uploadResult = await uploadFiles({
        files: [uploadedFile],
        folder: "manual-rental-agreements",
      });

      if (!uploadResult.success || !uploadResult.data?.uploadedFiles[0]) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      const uploadedFileData = uploadResult.data.uploadedFiles[0];

      // Then create the manual rental agreement record
      const response = await fetch(
        "/api/subscriber/pdf/manual-rental-agreement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            event_id: eventId,
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
          errorData.error || "Failed to create rental agreement record"
        );
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Manual rental agreement uploaded successfully!");
        setIsDialogOpen(false);
        setUploadedFile(null);
        fileUploadRef.current?.clearFiles();
        onUploadSuccess?.();
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading manual rental agreement:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload rental agreement"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDialogClose = () => {
    if (!isUploading) {
      setIsDialogOpen(false);
      setUploadedFile(null);
      fileUploadRef.current?.clearFiles();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload Manual Rental Agreement
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Manual Rental Agreement
            </DialogTitle>
            <DialogDescription>
              Upload your own rental agreement document. Only PDF files are
              accepted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FileUpload
              ref={fileUploadRef}
              onFilesChange={handleFileChange}
              maxFiles={1}
              maxSize={10} // 10MB
              acceptedFileTypes={["application/pdf"]}
              placeholder="Upload your rental agreement PDF"
              description="PDF files only, up to 10MB"
              disabled={isUploading}
            />

            {uploadedFile && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{uploadedFile.name}</span>
                  <span className="text-green-600">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
