"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { UserAddress } from "@/@types";
import { Label } from "../ui/label";

const excludedAreas = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Garage",
  "Basement",
  "Attic",
  "Home Office",
];

type Props = {
  property: UserAddress;
};

export function EventAreasSection({ property }: Props) {
  const { form, isReadOnly } = useEventForm();
  const {
    formState: { errors },
    watch,
    setValue,
  } = form;
  const watchedValues = watch();

  return (
    <div className="space-y-2">
      <div className=" mb-2">
        <Label className=" flex items-center gap-2">
          Areas Not Included in Rental{" "}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="info-icon h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-[300px] font-medium">
                <p className="text-center">
                  List areas of your home that are not included in the rental
                  event. Prime examples could be bedrooms, a home office,
                  private storage areas, etc. Taking time to be accurate here
                  reduces liability in case of audit and is required to be
                  eligible for any guarantee.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      <div className="flex flex-wrap gap-2">
        {excludedAreas.map((area) => (
          <Badge
            key={area}
            variant={
              watchedValues.excluded_areas &&
              watchedValues.excluded_areas.includes(area)
                ? "default"
                : "outline"
            }
            className={` rounded-md px-2 py-1 ${
              isReadOnly ? "" : "cursor-pointer"
            }`}
            onClick={() => {
              if (!isReadOnly) {
                if (
                  area === "Home Office" &&
                  property?.is_home_office_deduction &&
                  watchedValues.excluded_areas &&
                  watchedValues.excluded_areas.includes(area)
                ) {
                  return;
                }

                const currentAreas = watchedValues.excluded_areas?.trim() || "";
                const newAreas =
                  currentAreas && currentAreas.includes(area)
                    ? currentAreas
                        .replace(area, "")
                        .replace(/,\s*,/g, ",")
                        .replace(/^,|,$/g, "")
                    : currentAreas
                    ? `${currentAreas}, ${area}`
                    : area;
                setValue("excluded_areas", newAreas, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }
            }}
          >
            {area}
          </Badge>
        ))}
      </div>

      <div
        className="flex flex-col"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Input
          placeholder="Add custom area"
          value={watchedValues.excluded_areas || ""}
          onChange={(e) => {
            const newValue = e.target.value;
            if (
              property?.is_home_office_deduction &&
              watchedValues.excluded_areas &&
              watchedValues.excluded_areas.includes("Home Office") &&
              !newValue.includes("Home Office")
            ) {
              return;
            }
            setValue("excluded_areas", newValue, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            });
          }}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          maxLength={1000}
        />
        {errors.excluded_areas && (
          <div className="text-xs text-red-500 mt-1">
            {errors.excluded_areas.message}
          </div>
        )}
      </div>
    </div>
  );
}
