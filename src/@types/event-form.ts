import { EventFormData } from "./validation";
import { FutureDailyPricingDay, UserAddress } from "./index";
import { EventDatabase } from "./index";
export type EventFormMode = "create" | "edit" | "view";

export interface DatePrice {
  date: string; // YYYY-MM-DD format
  price: number;
}

export interface EventFormProps {
  mode: EventFormMode;
  property?: UserAddress & { is_custom_plan: boolean; avarage_value: number };
  initialData?: Partial<EventFormData> & {
    defendability_scores: DefensibilityScore;
  };
  onCancel?: () => void;
  showSidebar?: boolean;
  isLoading?: boolean;
  eventId?: string;
  eventsFromRentalAddress?: EventDatabase[];
  datePrices?: FutureDailyPricingDay[];
  business_address_id: string;
  is_custom_plan: boolean;
  rentalAddresses?: UserAddress[];
}

export interface EventFormContextType {
  mode: EventFormMode;
  isReadOnly: boolean;
  isEditMode: boolean;
  isCreateMode: boolean;
}

export interface TaxSavingsData {
  pastDeductions: number;
  eventsUsed: number;
  totalEvents: number;
  remainingEvents: number;
}

export interface DefensibilityItem {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

export interface DefensibilityScore {
  writtenNotes: boolean;
  morePeople: boolean;
  moreDuration: boolean;
  digitalValuation: boolean;
  moneyPaidToPersonnel: boolean;
  evidenceSupporting: boolean;
}

export interface ValidationStates {
  eventNameValid: boolean;
  descriptionValid: boolean;
  attendeesValid: boolean;
  hasValidDates: boolean;
  hasValidAmount: boolean;
}
