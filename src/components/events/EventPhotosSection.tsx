"use client";

import { Label } from "@/components/ui/label";
import {
  ExistingFile,
  FileUpload,
  FileUploadRef,
} from "@/components/ui/file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { useRef } from "react";

export function EventPhotosSection() {
  const { form, isReadOnly, clearTrigger } = useEventForm();
  const { setValue, watch } = form;
  const fileUploadRef = useRef<FileUploadRef>(null);

  const handleFilesChange = (files: File[]) => {
    setValue("upload_thumbnails", files, { shouldValidate: true, shouldDirty: true , shouldTouch: true});
  };

  const handleExistingFileRemove = (file: ExistingFile) => {
    const thumbnails = watch("thumbnails");
    const newThumbnails = thumbnails?.filter((doc: string) => doc !== file.id);
    setValue("thumbnails", newThumbnails, { shouldValidate: true, shouldDirty: true , shouldTouch: true});
  };

  const existingFiles: ExistingFile[] =
    watch("thumbnails")?.map((thumbnail) => ({
      id: thumbnail,
      name: thumbnail,
      url: thumbnail,
      type: "image",
      size: 0,
      created_at: new Date().toISOString(),
    })) || [];

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <Label className="flex items-center gap-2">
          (Optional) Event Photos
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[300px] font-medium">
                <p className="text-center">
                  Upload photos related to your event. These can help document
                  the business purpose and provide additional evidence for tax
                  deductions. Accepted formats: PNG, JPG, GIF up to 10MB each.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>

      <FileUpload
        onFilesChange={handleFilesChange}
        maxFiles={10}
        maxSize={10}
        acceptedFileTypes={[
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
        ]}
        disabled={isReadOnly}
        placeholder="Upload event photos"
        description="PNG, JPG, GIF up to 10MB each. Maximum 10 files."
        className="mt-2"
        onExistingFileRemove={handleExistingFileRemove}
        existingFiles={existingFiles}
        ref={fileUploadRef}
        clearTrigger={clearTrigger}
      />
    </div>
  );
}
