"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormData } from "@/@types/validation";
import { EventFormContextType } from "@/@types/event-form";
import { FutureDailyPricingDay } from "@/@types/index";
import { UserAddress } from "@/@types/index";
import { DateRange } from "react-day-picker";
export interface EventFormContextValue extends EventFormContextType {
  form: UseFormReturn<EventFormData>;
  selectedResidence: string;
  disabledDates: DateRange[] | undefined
  disabledDaysOfWeek: number[];
  validationStates: {
    eventNameValid: boolean;
    descriptionValid: boolean;
    peopleCountValid: boolean;
    hasValidDates: boolean;
    hasValidAmount: boolean;
  };
  defendabilityScore: {
    writtenNotes: boolean;
    morePeople: boolean;
    moreDuration: boolean;
    digitalValuation: boolean;
    moneyPaidToPersonnel: boolean;
  };
  property: UserAddress & { is_custom_plan: boolean, avarage_value: number } | undefined;
  clearTrigger: boolean; // New prop to trigger clearing
  setClearTrigger: (clearTrigger: boolean) => void;
  datePrices: FutureDailyPricingDay[];
  rentalAddresses: UserAddress[];
}

const EventFormContext = createContext<EventFormContextValue | undefined>(
  undefined
);

interface EventFormProviderProps {
  children: ReactNode;
  value: EventFormContextValue;
}

export function EventFormProvider({ children, value }: EventFormProviderProps) {
  return (
    <EventFormContext.Provider value={value}>
      {children}
    </EventFormContext.Provider>
  );
}

export function useEventForm() {
  const context = useContext(EventFormContext);
  if (context === undefined) {
    throw new Error("useEventForm must be used within an EventFormProvider");
  }
  return context;
}
