"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { useRouter } from "next/navigation";

export function EventDetailsSection() {
  const { form, isReadOnly, property, rentalAddresses } = useEventForm();
  const {
    register,
    formState: { errors },
    watch,
  } = form;
  const watchedValues = watch();
  const router = useRouter();

  const handleAddressChange = (addressId: string) => {
    // Navigate to the create event page with the selected address
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('residence', addressId);
    router.push(currentUrl.pathname + currentUrl.search);
  };

  return (
    <>
      {/* Residence */}
      <div>
        <Label className="text-sm font-medium text-gray-700">Residence</Label>
        {property ? (
          <div className="mt-1 p-3 bg-gray-50 border rounded-md text-sm text-gray-600">
            {property?.nickname ||
              `${property?.street || ""}, ${property?.city || ""}, ${
                property?.state || ""
              } ${property?.zip || ""}, ${property?.country || ""}`}
          </div>
        ) : (
          <div className="mt-1">
            <Select onValueChange={handleAddressChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a rental property" />
              </SelectTrigger>
              <SelectContent>
                {rentalAddresses?.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.nickname ||
                      `${address.street || ""}, ${address.city || ""}, ${
                        address.state || ""
                      } ${address.zip || ""}, ${address.country || ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Corporate Event Name */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium text-gray-700">
              Corporate Event Name
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-sm max-w-[300px] font-medium">
                  <p className="w-full text-center">
                    Example: project updates meeting, strategic planning,
                    project updates, etc.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500">
            {watchedValues.title?.length || 0}/50
          </span>
        </div>
        <Input
          className="mt-1"
          {...register("title")}
          maxLength={50}
          placeholder="Enter event name (5-50 characters)"
          disabled={isReadOnly}
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>
    </>
  );
}
