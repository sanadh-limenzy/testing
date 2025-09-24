"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import CalendarNavigation from "./CalendarNavigation";
import CalendarGrid from "./CalendarGrid";

import {
  isDateBooked,
  rangeContainsBookedDates,
  findAvailableRange,
  isDateInRange,
} from "./calendar-utils";

interface PriceCalendarProps {
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  disabled?: (date: Date) => boolean;
  bookedRanges?: DateRange[];
  triggerText?: string;
  onConfirm?: (range: DateRange | undefined) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  getPriceForDate?: (date: Date) => number;
}

export function PriceCalendar({
  selected,
  onSelect,
  disabled,
  bookedRanges = [],
  triggerText = "Select Dates",
  onConfirm,
  onCancel,
  readOnly = false,
  getPriceForDate,
}: PriceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<DateRange | undefined>(
    selected
  );
  const [wasAdjusted, setWasAdjusted] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Memoized combined disabled check
  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      return disabled?.(date) || isDateBooked(date, bookedRanges);
    },
    [disabled, bookedRanges]
  );

  const goToPreviousMonth = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setCurrentDate(new Date(year, month - 1, 1));
  }, [currentDate]);

  const goToNextMonth = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    setCurrentDate(new Date(year, month + 1, 1));
  }, [currentDate]);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (readOnly || isDateDisabled(date)) return;

      if (!tempSelected?.from || (tempSelected.from && tempSelected.to)) {
        setTempSelected({ from: date, to: undefined });
        setWasAdjusted(false);
      } else if (tempSelected.from && !tempSelected.to) {
        const from = date < tempSelected.from ? date : tempSelected.from;
        const to = date < tempSelected.from ? tempSelected.from : date;

        if (rangeContainsBookedDates(from, to, bookedRanges)) {
          const availableRange = findAvailableRange(from, to, bookedRanges);

          if (availableRange && availableRange.from && availableRange.to) {
            setTempSelected(availableRange);
            setWasAdjusted(true);
          } else {
            setTempSelected({ from: date, to: undefined });
            setWasAdjusted(false);
          }
          return;
        }

        setTempSelected({ from, to });
        setWasAdjusted(false);
      }
    },
    [readOnly, isDateDisabled, tempSelected, bookedRanges]
  );

  const isDateRangeStart = useCallback(
    (date: Date): boolean => {
      return tempSelected?.from?.getTime() === date.getTime();
    },
    [tempSelected?.from]
  );

  const isDateRangeEnd = useCallback(
    (date: Date): boolean => {
      return tempSelected?.to?.getTime() === date.getTime();
    },
    [tempSelected?.to]
  );

  const handleConfirm = useCallback(() => {
    console.log({tempSelected})
    onSelect?.(tempSelected);
    onConfirm?.(tempSelected);
    setIsOpen(false);
  }, [onSelect, onConfirm, tempSelected]);

  const handleCancel = useCallback(() => {
    setTempSelected(selected);
    onCancel?.();
    setIsOpen(false);
  }, [selected, onCancel]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (isOpening && open) return;

      setIsOpen(open);
      if (open) {
        setIsOpening(true);
        setTempSelected(selected);
        setWasAdjusted(false);

        setIsOpening(false);
      } else {
        setIsOpening(false);
      }
    },
    [selected, isOpening]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          style={{
            willChange: "auto",
            contain: "layout",
          }}
          disabled={isOpening}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selected?.from ? (
            selected.to ? (
              <>
                {selected.from.toLocaleDateString()} -{" "}
                {selected.to.toLocaleDateString()}
              </>
            ) : (
              selected.from.toLocaleDateString()
            )
          ) : (
            <span>{triggerText}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-full max-h-[90vh] lg:max-w-4xl"
        style={{
          contain: "layout style paint",
          willChange: "contents",
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {readOnly ? "Selected Dates" : "Select Your Dates"}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Your selected dates and pricing details."
              : "Choose your check-in and check-out dates. Double click on a date to select it. Or select two dates to create a range."}
          </DialogDescription>
          {wasAdjusted && !readOnly && (
            <span className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
              ⚠️ Your selection was adjusted to avoid booked dates. The largest
              available continuous range has been selected.
            </span>
          )}
        </DialogHeader>

        <div
          className="py-4 overflow-y-auto"
          style={{ contain: "layout style" }}
        >
          <CalendarNavigation
            currentDate={currentDate}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />
          <CalendarGrid
            currentDate={currentDate}
            isDateDisabled={isDateDisabled}
            isDateBooked={isDateBooked}
            isDateInRange={isDateInRange}
            isDateRangeStart={isDateRangeStart}
            isDateRangeEnd={isDateRangeEnd}
            handleDateClick={handleDateClick}
            readOnly={readOnly}
            bookedRanges={bookedRanges}
            tempSelected={tempSelected}
            getPriceForDate={getPriceForDate}
          />
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!tempSelected?.from}>
                Confirm Selection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// const CalendarLoadingSkeleton = () => {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
//         <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
//         <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
//       </div>

//       <div className="flex gap-8">
//         <div className="flex-1">
//           <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
//           <div className="grid grid-cols-7 gap-1">
//             {Array.from({ length: 7 }).map((_, i) => (
//               <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
//             ))}
//             {Array.from({ length: 35 }).map((_, i) => (
//               <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
//             ))}
//           </div>
//         </div>

//         <div className="flex-1 hidden sm:block">
//           <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
//           <div className="grid grid-cols-7 gap-1">
//             {Array.from({ length: 7 }).map((_, i) => (
//               <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
//             ))}
//             {Array.from({ length: 35 }).map((_, i) => (
//               <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
