"use client";

import React from "react";
import type { DateRange } from "react-day-picker";

interface CalendarMonthProps {
  monthOffset: number;
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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarMonth = React.memo(({
  monthOffset,
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
}: CalendarMonthProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + monthOffset;
  const monthDate = new Date(year, month, 1);
  const actualYear = monthDate.getFullYear();
  const actualMonth = monthDate.getMonth();

  const firstDayOfMonth = new Date(actualYear, actualMonth, 1);
  const lastDayOfMonth = new Date(actualYear, actualMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Create weeks array
  const weeks = [];
  let currentWeek = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(
      <td
        key={`empty-${i}`}
        className="h-10 md:h-14 w-10 md:w-14"
        style={{ aspectRatio: "1" }}
      />
    );
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(actualYear, actualMonth, day);
    const price = getPriceForDate ? getPriceForDate(date) : "";
    const isDisabled = isDateDisabled(date);
    const isBooked = isDateBooked(date, bookedRanges);
    const inRange = isDateInRange(date, tempSelected);
    const isStart = isDateRangeStart(date);
    const isEnd = isDateRangeEnd(date);

    currentWeek.push(
      <CalendarDay
        key={day}
        date={date}
        day={day}
        price={price}
        isDisabled={isDisabled}
        isBooked={isBooked}
        inRange={inRange}
        isStart={isStart}
        isEnd={isEnd}
        readOnly={readOnly}
        onDateClick={handleDateClick}
      />
    );

    // If we've filled a week (7 days) or reached the end of the month, start a new week
    if (currentWeek.length === 7) {
      weeks.push(<tr key={`week-${weeks.length}`}>{currentWeek}</tr>);
      currentWeek = [];
    }
  }

  // Fill remaining cells in the last week if needed
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(
      <td
        key={`empty-end-${currentWeek.length}`}
        className="h-10 md:h-14 w-10 md:w-14"
        style={{ aspectRatio: "1" }}
      />
    );
  }

  // Add the last week if it has content
  if (currentWeek.length > 0) {
    weeks.push(<tr key={`week-${weeks.length}`}>{currentWeek}</tr>);
  }

  return (
    <div
      className={`flex-1 ${monthOffset === 1 ? "hidden sm:block" : ""}`}
    >
      {/* Month header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 hidden lg:block">
          {monthNames[actualMonth]} {actualYear}
        </h3>
      </div>

      {/* Calendar table */}
      <table className="w-full border-collapse">
        {/* Day headers */}
        <thead>
          <tr>
            {dayNames.map((day) => (
              <th
                key={day}
                className="h-10 md:h-14 w-10 md:w-14 text-sm font-medium text-gray-600 border border-gray-200"
                style={{ aspectRatio: "1" }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        {/* Calendar body */}
        <tbody>{weeks}</tbody>
      </table>
    </div>
  );
});

CalendarMonth.displayName = "CalendarMonth";

// Calendar Day Component
interface CalendarDayProps {
  date: Date;
  day: number;
  price: string | number;
  isDisabled: boolean;
  isBooked: boolean;
  inRange: boolean;
  isStart: boolean;
  isEnd: boolean;
  readOnly: boolean;
  onDateClick: (date: Date) => void;
}

const CalendarDay = React.memo(({
  date,
  day,
  price,
  isDisabled,
  isBooked,
  inRange,
  isStart,
  isEnd,
  readOnly,
  onDateClick,
}: CalendarDayProps) => {
  return (
    <td
      className="h-10 md:h-14 w-10 md:w-14"
      style={{ aspectRatio: "1" }}
    >
      <button
        onClick={() => onDateClick(date)}
        disabled={isDisabled || readOnly}
        className={`
          w-full h-10 md:h-14 flex flex-col items-center justify-center text-sm border border-gray-200 transition-colors
          ${isDisabled && !isBooked ? "opacity-50 cursor-not-allowed " : ""}
          ${readOnly ? "cursor-default" : "cursor-pointer"}
          ${
            isBooked
              ? "bg-red-100 text-red-800 cursor-not-allowed border-red-200"
              : readOnly
              ? ""
              : "cursor-pointer "
          }
          ${
            inRange && !isBooked
              ? "bg-primary text-white hover:bg-primary/90"
              : ""
          }
          ${isStart && !isBooked ? "rounded-l-lg" : ""}
          ${isEnd && !isBooked ? "rounded-r-lg" : ""}
          ${isStart && isEnd && !isBooked ? "rounded-lg" : ""}
          ${isBooked ? "rounded-md" : ""}
        `}
        style={{ willChange: "background-color, color" }}
      >
        <span
          className={`font-medium ${
            inRange && !isBooked
              ? "text-white"
              : isBooked
              ? "text-red-800"
              : "text-gray-900"
          }`}
        >
          {day}
        </span>
        <span
          className={`text-[0.6rem] mt-1 ${
            inRange && !isBooked
              ? "text-blue-100"
              : isBooked
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {isBooked ? "Booked" : price ? `$${price}` : ""}
        </span>
      </button>
    </td>
  );
});

CalendarDay.displayName = "CalendarDay";
