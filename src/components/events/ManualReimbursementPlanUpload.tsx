"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";
import { useAuthContext } from "@/contexts/AuthContext";
import { useManualReimbursementPlanUpload } from "@/hooks/useReimbursementPlan";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Upload, FileText } from "lucide-react";

interface ManualReimbursementPlanUploadProps {
  onUploadSuccess?: () => void;
}

export default function ManualReimbursementPlanUpload({
  onUploadSuccess,
}: ManualReimbursementPlanUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileUploadRef = useRef<FileUploadRef>(null);
  const { session } = useAuthContext();
  const { mutateAsync: uploadManualPlan, isPending: isUploading } = useManualReimbursementPlanUpload();

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
    } else {
      setUploadedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      return;
    }

    if (!session?.access_token) {
      return;
    }

    await uploadManualPlan(
      {
        file: uploadedFile,
        access_token: session.access_token,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setUploadedFile(null);
          fileUploadRef.current?.clearFiles();
          onUploadSuccess?.();
        },
      }
    );
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
        Upload Manual Plan
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Manual Reimbursement Plan
            </DialogTitle>
            <DialogDescription>
              Upload your own reimbursement plan document. Only PDF files are
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
              placeholder="Upload your reimbursement plan PDF"
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
