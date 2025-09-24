"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";

export function EventDescriptionSection() {
  const { form, isReadOnly } = useEventForm();
  const { register, formState: { errors }, watch } = form;
  const watchedValues = watch();
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm p-0 max-w-xs lg:max-w-md py-3 px-0 font-medium">
                <p className="w-full text-center">
                  Describe your event in as much detail as possible so that you
                  are clear about what the business event is about. This is the
                  description that holds weight in the event of an audit.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs text-gray-500">
          {watchedValues.description?.length || 0}/1000
        </span>
      </div>
      <Textarea
        className="mt-1 min-h-[100px]"
        {...register("description")}
        placeholder="Enter event description (optional)"
        disabled={isReadOnly}
        maxLength={1000}
      />
      {errors.description && (
        <p className="text-xs text-red-500 mt-1">
          {errors.description.message}
        </p>
      )}
    </div>
  );
}
