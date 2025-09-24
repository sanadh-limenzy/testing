"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Matcher } from "react-day-picker"

export interface DatePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[] // Array of specific dates to disable
  disabledDaysOfWeek?: number[] // Array of day numbers (0 = Sunday, 1 = Monday, etc.)
}

/**
 * DatePicker component with support for disabling specific dates from API
 * 
 * @example
 * // Basic usage
 * <DatePicker value={date} onChange={setDate} />
 * 
 * @example
 * // With disabled dates from API
 * const disabledDates = [new Date('2024-01-15'), new Date('2024-01-20')];
 * const disabledDaysOfWeek = [0, 6]; // Disable weekends
 * 
 * <DatePicker 
 *   value={date} 
 *   onChange={setDate}
 *   disabledDates={disabledDates}
 *   disabledDaysOfWeek={disabledDaysOfWeek}
 *   minDate={new Date()}
 * />
 * 
 * @example
 * // Fetching disabled dates from API
 * const { data: disabledDatesData } = useQuery({
 *   queryKey: ['disabled-dates', propertyId],
 *   queryFn: async () => {
 *     const response = await fetch(`/api/events/disabled-dates?propertyId=${propertyId}`);
 *     return response.json();
 *   }
 * });
 * 
 * const disabledDates = useMemo(() => 
 *   disabledDatesData?.data?.disabledDates?.map(date => new Date(date)) || []
 * , [disabledDatesData]);
 * 
 * <DatePicker 
 *   value={date} 
 *   onChange={setDate}
 *   disabledDates={disabledDates}
 *   disabledDaysOfWeek={disabledDatesData?.data?.disabledDaysOfWeek || []}
 * />
 */

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  disabledDaysOfWeek = [],
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  // Sync external value
  React.useEffect(() => {
    if (value !== undefined) {
      setDate(value ? new Date(value) : undefined)
    }
  }, [value])

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    onChange?.(newDate)
  }

  // Build disabled rules
  const disabledRules: Matcher[] = []
  if (minDate) disabledRules.push({ before: minDate })
  if (maxDate) disabledRules.push({ after: maxDate })
  
  // Add specific disabled dates
  if (disabledDates.length > 0) {
    disabledRules.push(...disabledDates)
  }
  
  // Add disabled days of week
  if (disabledDaysOfWeek.length > 0) {
    disabledRules.push({ dayOfWeek: disabledDaysOfWeek })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          data-empty={!date}
          className={cn(
            "w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabledRules.length > 0 ? disabledRules : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
