"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { useFieldArray } from "react-hook-form";

export function EventAttendeesSection() {
  const { form, isReadOnly } = useEventForm();
  const {
    register,
    formState: { errors },
    control,
    setValue,
    watch,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "people_names",
  });

  // Sync people_names array with people_count
  const handlePeopleCountChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(e.target.value) || 0;
    if (value > 99) return;
    setValue("people_count", Number(value).toString(), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    const currentFieldsCount = fields.length;

    if (value > currentFieldsCount) {
      for (let i = currentFieldsCount; i < value; i++) {
        append({ name: "" }, { shouldFocus: false });
      }
    } else if (value < currentFieldsCount) {
      for (let i = currentFieldsCount - 1; i >= value; i--) {
        remove(i);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium text-gray-700">
            Number of Attendees
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[300px] font-medium">
                <p className="w-full text-center">
                  Include all who are actively participating in the business
                  purpose of the meeting. Do not include non-participating
                  children, guests, etc. if they are present.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Input
        className="mt-1"
        type="number"
        value={watch("people_count")}
        onChange={handlePeopleCountChange}
        placeholder="Enter number of attendees"
        min={1}
        max={99}
        maxLength={2}
        disabled={isReadOnly}
      />
      {errors.people_count && (
        <p className="text-xs text-red-500 mt-1">
          {errors.people_count.message}
        </p>
      )}

      {/* Attendee Names Section */}
      {fields.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-gray-700">
              Attendee Names
            </Label>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    maxLength={50}
                    {...register(`people_names.${index}.name`)}
                    placeholder={`Attendee ${index + 1} name`}
                    disabled={isReadOnly}
                  />
                  {errors.people_names?.[index]?.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.people_names[index]?.name?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
