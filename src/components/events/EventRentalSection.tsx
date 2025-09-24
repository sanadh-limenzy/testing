"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { useRef, useState } from "react";
import { ExistingFile } from "@/components/ui/file-upload";
import { differenceInDays, eachDayOfInterval } from "date-fns";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function EventRentalSection() {
  const { form, isReadOnly, clearTrigger } = useEventForm();
  const {
    formState: { errors },
    watch,
    setValue,
  } = form;

  const watchedValues = watch();
  const fileUploadRef = useRef<FileUploadRef>(null);
  const [showManualValuationDialog, setShowManualValuationDialog] =
    useState(false);

  const handleManualValuationSwitch = (checked: boolean) => {
    if (checked && !watchedValues.manual_valuation) {
      // User is trying to enable manual valuation - show confirmation
      setShowManualValuationDialog(true);
    } else {
      // User is disabling manual valuation - allow directly
      setValue("manual_valuation", checked, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleConfirmManualValuation = () => {
    setValue("manual_valuation", true, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleFilesChange = (files: File[]) => {
    setValue("upload_documents", files, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleExistingFileClick = (file: ExistingFile) => {
    console.log("Existing file clicked:", file.name);
  };

  const handleExistingFileRemove = (file: ExistingFile | string) => {
    if (typeof file !== "string") {
      const event_documents = watch("event_documents");
      const newEventDocuments = event_documents?.filter(
        (doc: ExistingFile) => doc.id !== file.id
      );
      setValue("event_documents", newEventDocuments, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };
  const uploadedFiles = watchedValues.upload_documents || [];
  const no_of_days =
    watchedValues.end_date && watchedValues.start_date
      ? differenceInDays(watchedValues.end_date, watchedValues.start_date) + 1
      : 1;

  const onDailyAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dailyAmount = Number(event.target.value);
    if (isNaN(dailyAmount)) return;

    if (!watchedValues.start_date || !watchedValues.end_date) {
      // Still allow typing daily amount even without dates
      setValue("rental_amount", dailyAmount.toString(), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }

    const noOfDays =
      differenceInDays(watchedValues.end_date, watchedValues.start_date) + 1;

    const totalAmount = dailyAmount * noOfDays;

    setValue("rental_amount", totalAmount.toString(), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    const days = eachDayOfInterval({
      start: watchedValues.start_date,
      end: watchedValues.end_date,
    });

    const dailyAmounts = days.map((day) => ({
      date: day.toISOString(),
      amount: dailyAmount,
    }));

    setValue("daily_amounts", dailyAmounts, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const daily_amount =
    watchedValues.start_date && watchedValues.end_date
      ? Number(watchedValues.rental_amount || 0) / no_of_days || ""
      : watchedValues.rental_amount || "";

  return (
    <div className="bg-neutral-50 p-5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-gray-700">
            {!watchedValues.manual_valuation
              ? "Rental Amount"
              : "Daily Rental Amount ($ per day)"}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[300px] font-medium">
                <p className="w-full text-center">
                  Enter the daily rental amount for your property
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Manual Valuation</Label>
          <Switch
            checked={watchedValues.manual_valuation}
            onCheckedChange={handleManualValuationSwitch}
            disabled={isReadOnly}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[300px] font-medium">
                <p className="w-full text-center">
                  Enable to manually set rental amounts and upload valuation
                  documents
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {watchedValues.manual_valuation ? (
        <div className="space-y-4">
          {/* Warning Box */}
          <Card className="border-amber-200 bg-yellow-50 p-0">
            <CardContent className="p-0">
              <div className="flex items-start gap-3 p-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">
                    Manual Valuation
                  </h4>
                  <p className="text-sm text-amber-700">
                    Setting your own rental amount requires proper documentation
                    to support the valuation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Amount Input */}
          <div>
            <Input
              type="number"
              onChange={onDailyAmountChange}
              value={daily_amount}
              placeholder="Enter daily rental amount"
              disabled={isReadOnly || !watchedValues.manual_valuation}
              step="0.01"
              min="0"
              max={9999999999}
            />

            {errors.rental_amount && (
              <p className="text-xs text-red-500 mt-1">
                {errors.rental_amount.message}
              </p>
            )}
          </div>

          {/* File Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">
                  Valuation Documents (Required)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="text-sm max-w-[300px] font-medium">
                      <p className="w-full text-center">
                        Upload supporting documents for your rental valuation
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {uploadedFiles.length > 0 && (
                <span className="text-xs text-gray-500">
                  {uploadedFiles.length} file
                  {uploadedFiles.length !== 1 ? "s" : ""} uploaded
                </span>
              )}
            </div>

            <FileUpload
              ref={fileUploadRef}
              onFilesChange={handleFilesChange}
              onExistingFileClick={handleExistingFileClick}
              existingFiles={watchedValues.event_documents || []}
              maxFiles={5}
              maxSize={10}
              acceptedFileTypes={[
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/jpeg",
                "image/png",
                "image/jpg",
              ]}
              placeholder="Upload a file or drag and drop"
              description="PDF, DOCX, XLSX, JPG, PNG up to 10MB"
              disabled={isReadOnly || !watchedValues.manual_valuation}
              error={errors.upload_documents?.message}
              onExistingFileRemove={handleExistingFileRemove}
              clearTrigger={clearTrigger}
            />
          </div>
        </div>
      ) : (
        <Input
          type="number"
          value={watchedValues.rental_amount}
          placeholder=""
          disabled
          step="0.01"
          min="0"
          max={999999999999}
        />
      )}

      {!watchedValues.manual_valuation && errors.rental_amount && (
        <p className="text-xs text-red-500 mt-1">
          {errors.rental_amount.message}
        </p>
      )}

      {/* Manual Valuation Confirmation Dialog */}
      <ConfirmationDialog
        open={showManualValuationDialog}
        onOpenChange={setShowManualValuationDialog}
        title="Are you sure you want to change your rental price?"
        description=""
        note="Using manual valuation is NOT recommended. You will need to provide supporting documents if you wish to use manual valuation."
        confirmText="Use Manual Valuation"
        cancelText="Cancel"
        onConfirm={handleConfirmManualValuation}
        variant="warning"
      />
    </div>
  );
}
