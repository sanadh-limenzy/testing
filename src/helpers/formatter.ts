import { UserAddress } from "@/@types";
import { format, parse, isValid } from "date-fns";

/**
 * @example
 * formatCurrencyValue(2500) // Returns "$2,500"
 * formatCurrencyValue(2500.15) // Returns "$2,500.15"
 */
const formatCurrencyValue = (data: number) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const currency = formatter.format(data);
  if (currency && currency.split(".")[1] === "00") {
    return currency.split(".")[0];
  }
  return currency;
};

/**
 * Generates formatted rental time slot strings from daily amounts and event times
 *                          "MMMM dd, yyyy from hh:mmaa To: hh:mmaa ($amount)"
 * @example
 * const dailyAmounts = [
 *   { date: "2024-01-15", amount: 250.00 },
 *   { date: "2024-01-16", amount: 275.50 }
 * ];
 * getRentalTimeSlots(dailyAmounts, "08:00 am", "01:00 pm")
 * // Returns: [
 * //   "January 15, 2024 from 08:00AM To: 01:00PM ($250)",
 * //   "January 16, 2024 from 08:00AM To: 01:00PM ($275.50)"
 * // ]
 */
const getRentalTimeSlots = (
  dailyAmounts: { date: string; amount: number }[],
  eventStartTime: string,
  eventEndTime: string
) => {
  if (!dailyAmounts || !Array.isArray(dailyAmounts)) return [];

  return dailyAmounts.map((slot) => {
    // Parse the date and format it
    const slotDate = new Date(slot.date);
    const formattedDate = format(slotDate, "MMMM dd, yyyy");

    // Handle undefined or null time values
    let formattedStartTime = eventStartTime || "N/A";
    let formattedEndTime = eventEndTime || "N/A";

    // Only try to parse if we have valid time strings
    if (
      eventStartTime &&
      eventEndTime &&
      typeof eventStartTime === "string" &&
      typeof eventEndTime === "string"
    ) {
      try {
        // Try to parse and reformat the times for consistency
        const startTimeDate = parse(eventStartTime, "hh:mm aa", new Date());
        const endTimeDate = parse(eventEndTime, "hh:mm aa", new Date());

        if (isValid(startTimeDate) && isValid(endTimeDate)) {
          formattedStartTime = format(startTimeDate, "hh:mmaa");
          formattedEndTime = format(endTimeDate, "hh:mmaa");
        }
      } catch (error) {
        // If parsing fails, use the original times as fallback
        console.warn(
          "Time parsing failed, using original format:",
          error instanceof Error ? error.message : "Unknown error"
        );
        formattedStartTime = eventStartTime;
        formattedEndTime = eventEndTime;
      }
    }

    const amount = formatCurrencyValue(slot.amount);

    return `${formattedDate} from ${formattedStartTime} To: ${formattedEndTime} (${amount})`;
  });
};

/**
 * Formats an address object into a single readable text string
 * @example
 * const address = {
 *   street: "123 Main St",
 *   city: "Anytown",
 *   state: "CA",
 *   zipCode: "12345"
 * };
 * formatAddressInSingleText(address) // Returns "123 Main St, Anytown, CA 12345"
 */

const formatAddressInSingleText = (address: Omit<UserAddress, "id">) => {
  if (!address) return "N/A";

  let streetAddress = address.street;
  if (address.apartment) {
    streetAddress = streetAddress
      ? `${streetAddress}, ${address.apartment}`
      : address.apartment;
  }

  const parts = [
    streetAddress,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "N/A";
};

export { getRentalTimeSlots, formatCurrencyValue, formatAddressInSingleText };
