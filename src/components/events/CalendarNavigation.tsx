"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarNavigationProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CalendarNavigationComponent = React.memo(({
  currentDate,
  onPreviousMonth,
  onNextMonth,
}: CalendarNavigationProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-center">
        <h3 className="lg:hidden text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});

CalendarNavigationComponent.displayName = "CalendarNavigation";

export const CalendarNavigation = CalendarNavigationComponent;
export default CalendarNavigationComponent;
