"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon, Clock, AlertCircle } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { PriceCalendar } from "./pricing-calendar";
import { DateRange } from "react-day-picker";
import { differenceInDays, eachDayOfInterval, format } from "date-fns";
import { useCallback } from "react";
import { toast } from "sonner";
import { EventDatabase } from "@/@types/index";

export function EventTimingSection() {
  const { form, disabledDates, isReadOnly, isEditMode, property, datePrices, eventsFromRentalAddress, eventId } =
    useEventForm();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;
  const watchedValues = watch();

  // Calculate if the selected dates exceed the 14-day limit
  const exceeds14DayLimit = React.useMemo(() => {
    if (!watchedValues.start_date || !watchedValues.end_date || isEditMode) return false;
    
    const eventsFromRentalAddressWithoutTheCurrentEvent = eventsFromRentalAddress?.filter((event) => event.id !== eventId);
    
    const pastEventDays = eventsFromRentalAddressWithoutTheCurrentEvent?.reduce((acc: number, event: EventDatabase) => {
      return event.start_date && event.end_date
        ? acc + (differenceInDays(new Date(event.end_date), new Date(event.start_date)) + 1)
        : acc;
    }, 0) || 0;
    
    const newEventDays = differenceInDays(new Date(watchedValues.end_date), new Date(watchedValues.start_date)) + 1;
    const totalDaysUsed = pastEventDays + newEventDays;
    
    return totalDaysUsed > 14;
  }, [watchedValues.start_date, watchedValues.end_date, eventsFromRentalAddress, eventId, isEditMode]);

  const getPriceForDate = useCallback(
    (date: Date) => {
      const targetDateFormatted = format(date, "ddMMyyyy");
      return (
        datePrices.find((price) => {
          const priceDate = new Date(price.date);
          return format(priceDate, "ddMMyyyy") === targetDateFormatted;
        })?.price_percentile_90 || 0
      );
    },
    [datePrices]
  );

  const onSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;
    range.from.setHours(0, 0, 0, 0);
    range.to.setHours(0, 0, 0, 0);

    const start_date = range.from.toISOString();
    const end_date = range.to.toISOString();

    setValue("start_date", start_date, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("end_date", end_date, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    const num_of_days = differenceInDays(range?.to, range?.from) + 1;
    const days = eachDayOfInterval({ start: start_date, end: end_date });

    console.log({rental_amount: watchedValues.rental_amount})

    if (!watchedValues.manual_valuation) {
      if (property?.is_custom_plan) {
        setValue(
          "rental_amount",
          watchedValues.manual_valuation
            ? ""
            : (property?.avarage_value * num_of_days).toString(),
          { shouldValidate: true, shouldDirty: true, shouldTouch: true }
        );

        const daily_amounts = days.map((day) => ({
          date: day.toISOString(),
          amount: property?.avarage_value,
        }));
        setValue("daily_amounts", daily_amounts, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        return;
      } else {
        const daily_amounts = days.map((day) => ({
          date: day.toISOString(),
          amount: getPriceForDate(day),
        }));

        if (daily_amounts.some((day) => day.amount === 0)) {
          setValue("manual_valuation", true, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          setValue("rental_amount", "0", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          setValue("daily_amounts", [], {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          toast.error(
            <span>
              Sorry, there are date(s) with no pricing data. Switched to{" "}
              <span className="font-bold underline text-red-500">
                manual valuation.
              </span>
            </span>
          );
          return;
        }

        setValue("daily_amounts", daily_amounts, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        const rental_amount = daily_amounts.reduce(
          (acc, curr) => acc + curr.amount,
          0
        );
        setValue("rental_amount", rental_amount.toString(), {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        return;
      }
    } else {
      const rental_amount = watchedValues.rental_amount;
      if (!rental_amount) return;

      const daily_amounts = days.map((day) => ({
        date: day.toISOString(),
        amount: Number(rental_amount) / num_of_days,
      }));
      setValue("daily_amounts", daily_amounts, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }
  };

  return (
    <>
      {/* Start and End Date */}
      <div className="grid grid-cols-1 gap-4">
        <PriceCalendar
          selected={
            watchedValues.start_date && watchedValues.end_date
              ? {
                  from: new Date(watchedValues.start_date),
                  to: new Date(watchedValues.end_date),
                }
              : undefined
          }
          onSelect={onSelect}
          bookedRanges={disabledDates}
          readOnly={isReadOnly || isEditMode}
          getPriceForDate={getPriceForDate}
        />
        
        {/* 14-day limit validation error */}
        {exceeds14DayLimit && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Event duration exceeds annual limit</p>
              <p className="mt-1">
                This event would exceed the 14-day annual limit for this rental property. 
                Please reduce the event duration or choose different dates.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Start and End Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium text-gray-700">
              Start Time
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-sm max-w-[300px] font-medium">
                  <p className="max-w-fit">
                    We advise that your meeting is 4.5 hours or more for
                    authenticity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative mt-1">
            <Input
              type="time"
              {...register("start_time")}
              disabled={isReadOnly}
            />
            <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          {errors.start_time && (
            <p className="text-xs text-red-500 mt-1">
              {errors.start_time.message}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium text-gray-700">
              End Time
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-sm max-w-[300px] font-medium">
                  <p>
                    We advise that your meeting is 4.5 hours or more for
                    authenticity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative mt-1">
            <Input
              type="time"
              {...register("end_time")}
              disabled={isReadOnly}
            />
            <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          {errors.end_time && (
            <p className="text-xs text-red-500 mt-1">
              {errors.end_time.message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
