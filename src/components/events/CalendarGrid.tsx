"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { CalendarMonth } from "./CalendarMonth";

interface CalendarGridProps {
  currentDate: Date;
  isDateDisabled: (date: Date) => boolean;
  isDateBooked: (date: Date, bookedRanges: DateRange[]) => boolean;
  isDateInRange: (date: Date, tempSelected: DateRange | undefined) => boolean;
  isDateRangeStart: (date: Date) => boolean;
  isDateRangeEnd: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
  readOnly: boolean;
  bookedRanges: DateRange[];
  tempSelected: DateRange | undefined;
  getPriceForDate?: (date: Date) => number;
}

const CalendarGridComponent = React.memo(({
  currentDate,
  isDateDisabled,
  isDateBooked,
  isDateInRange,
  isDateRangeStart,
  isDateRangeEnd,
  handleDateClick,
  readOnly,
  bookedRanges,
  tempSelected,
  getPriceForDate,
}: CalendarGridProps) => {
  return (
    <div className="flex gap-8">
      <CalendarMonth
        monthOffset={0}
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
      <CalendarMonth
        monthOffset={1}
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
  );
});

CalendarGridComponent.displayName = "CalendarGrid";

export const CalendarGrid = CalendarGridComponent;
export default CalendarGridComponent;
