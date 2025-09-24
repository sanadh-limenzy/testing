"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon, Clock } from "lucide-react";
import { useEventForm } from "@/contexts/EventFormContext";
import { PriceCalendar } from "./pricing-calendar";
import { DateRange } from "react-day-picker";
import { differenceInDays, eachDayOfInterval, format } from "date-fns";
import { useCallback } from "react";
import { toast } from "sonner";

export function EventTimingSection() {
  const { form, disabledDates, isReadOnly, isEditMode, property, datePrices } =
    useEventForm();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;
  const watchedValues = watch();

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
