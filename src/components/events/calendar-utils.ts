import type { DateRange } from "react-day-picker";

/**
 * Check if a date is booked within the given booked ranges
 */
export const isDateBooked = (date: Date, bookedRanges: DateRange[]): boolean => {
  return bookedRanges.some((range) => {
    if (!range.from) return false;
    if (!range.to) return date.getTime() === range.from.getTime();
    return date >= range.from && date <= range.to;
  });
};

/**
 * Check if a date range contains any booked dates
 */
export const rangeContainsBookedDates = (
  from: Date,
  to: Date,
  bookedRanges: DateRange[]
): boolean => {
  const currentDate = new Date(from);
  while (currentDate <= to) {
    if (isDateBooked(currentDate, bookedRanges)) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return false;
};

/**
 * Find the largest available continuous range within the selected range
 */
export const findAvailableRange = (
  from: Date,
  to: Date,
  bookedRanges: DateRange[]
): DateRange | null => {
  const ranges: DateRange[] = [];
  let currentStart: Date | null = null;

  const startDate = new Date(from);
  const endDate = new Date(to);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!isDateBooked(currentDate, bookedRanges)) {
      if (!currentStart) {
        currentStart = new Date(currentDate);
      }
    } else {
      if (currentStart) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        ranges.push({ from: currentStart, to: prevDate });
        currentStart = null;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add final range if we ended on available dates
  if (currentStart) {
    ranges.push({ from: currentStart, to: new Date(endDate) });
  }

  // Return the longest available range
  if (ranges.length === 0) return null;

  return ranges.reduce((longest, current) => {
    const currentLength =
      current.to && current.from
        ? current.to.getTime() - current.from.getTime()
        : 0;
    const longestLength =
      longest.to && longest.from
        ? longest.to.getTime() - longest.from.getTime()
        : 0;
    return currentLength > longestLength ? current : longest;
  });
};

/**
 * Check if a date is within the selected range
 */
export const isDateInRange = (
  date: Date,
  tempSelected: DateRange | undefined
): boolean => {
  if (!tempSelected?.from) return false;
  if (!tempSelected.to) return date.getTime() === tempSelected.from.getTime();
  return date >= tempSelected.from && date <= tempSelected.to;
};
