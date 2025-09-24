import { parse, format } from "date-fns";

/**
 * Checks if a time string is in 12-hour format (contains AM/PM)
 * @param timeString - Time string to check
 * @returns true if in 12-hour format, false otherwise
 */
function isIn12HourFormat(timeString: string): boolean {
  return /\b(am|pm)\b/i.test(timeString);
}

/**
 * Checks if a time string is in 24-hour format (HH:mm without AM/PM)
 * @param timeString - Time string to check
 * @returns true if in 24-hour format, false otherwise
 */
function isIn24HourFormat(timeString: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(timeString) && !isIn12HourFormat(timeString);
}

/**
 * Converts time from "01:00 pm" format to "17:42" format (24-hour)
 * @param timeString - Time string in "h:mm a" format (e.g., "01:00 pm") or already in 24-hour format
 * @returns Time string in "HH:mm" format (e.g., "17:42") or empty string if invalid
 */
export function convertTo24HourFormat(timeString: string | null | undefined): string {
  if (!timeString) return "";
  
  // If already in 24-hour format, return as is
  if (isIn24HourFormat(timeString)) {
    return timeString;
  }
  
  // If not in 12-hour format, return original
  if (!isIn12HourFormat(timeString)) {
    return timeString;
  }
  
  try {
    // Parse the time string in "h:mm a" format (e.g., "01:00 pm")
    const parsedTime = parse(timeString, "h:mm a", new Date());
    // Format it to "HH:mm" format (e.g., "17:42")
    return format(parsedTime, "HH:mm");
  } catch (error) {
    console.error("Error converting time format:", error);
    return timeString; // Return original if conversion fails
  }
}

/**
 * Converts time from "17:42" format to "01:00 pm" format (12-hour)
 * @param timeString - Time string in "HH:mm" format (e.g., "17:42") or already in 12-hour format
 * @returns Time string in "h:mm a" format (e.g., "01:00 pm") or empty string if invalid
 */
export function convertTo12HourFormat(timeString: string | null | undefined): string {
  if (!timeString) return "";
  
  // If already in 12-hour format, return as is
  if (isIn12HourFormat(timeString)) {
    return timeString;
  }
  
  // If not in 24-hour format, return original
  if (!isIn24HourFormat(timeString)) {
    return timeString;
  }
  
  try {
    // Parse the time string in "HH:mm" format (e.g., "17:42")
    const parsedTime = parse(timeString, "HH:mm", new Date());
    // Format it to "h:mm a" format (e.g., "01:00 pm")
    return format(parsedTime, "h:mm a");
  } catch (error) {
    console.error("Error converting to 12-hour format:", error);
    return timeString; // Return original if conversion fails
  }
}

/**
 * Calculates the duration in hours between two time strings
 * @param startTime - Start time in "HH:mm" format (e.g., "09:00")
 * @param endTime - End time in "HH:mm" format (e.g., "17:30")
 * @returns Duration in hours as a number, or null if invalid times
 */
export function calculateDurationInHours(startTime: string | null | undefined, endTime: string | null | undefined): number | null {
  if (!startTime || !endTime) return null;
  
  try {
    // Parse the time strings
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());
    
    // Calculate the difference in milliseconds
    const diffInMs = end.getTime() - start.getTime();
    
    // Convert to hours
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    // Handle case where end time is on the next day (e.g., 23:00 to 01:00)
    if (diffInHours < 0) {
      return diffInHours + 24;
    }
    
    return diffInHours;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return null;
  }
}

/**
 * Checks if the duration between two times meets the minimum requirement
 * @param startTime - Start time in "HH:mm" format (e.g., "09:00")
 * @param endTime - End time in "HH:mm" format (e.g., "17:30")
 * @param minHours - Minimum hours required (default: 4.5)
 * @returns true if duration meets minimum requirement, false otherwise
 */
export function meetsMinimumDuration(startTime: string | null | undefined, endTime: string | null | undefined, minHours: number = 4.5): boolean {
  const duration = calculateDurationInHours(startTime, endTime);
  return duration !== null && duration >= minHours;
}
