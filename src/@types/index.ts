import { ExistingFile } from "@/components/ui/file-upload";

export interface GoogleAddress {
  street: string;
  city: string;
  county: string;
  state: string;
  pinCode: string;
  country: string;
  description: string;
  lat: number;
  lng: number;
}

export interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

export interface GooglePlaceDetail {
  address: string;
  city: string;
  county: string;
  state: string;
  country: string;
  postal: string;
  lat: number;
  lng: number;
}

// Google Places API Types
export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

export interface GooglePlaceComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GooglePlaceResult {
  address_components: GooglePlaceComponent[];
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
}

export interface GoogleGeocodeResult {
  results: GooglePlaceResult[];
  status: string;
}

export interface AddressComponents {
  [key: string]: string[];
}

export interface UserAddress {
  id: string;
  mongo_id?: string;
  created_by?: string;
  address_type?: string;
  business_name?: string;
  business_phone_code?: string;
  business_phone?: string;
  business_email?: string;
  business_entity_type?: string;
  business_nature?: string;
  is_home_office_deduction?: boolean;
  tax_filing_status?: string;
  estimated_income?: number;
  nickname?: string;
  street?: string;
  description?: string;
  apartment?: string;
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  bedrooms?: number;
  country?: string;
  lat?: number;
  lng?: number;
  time_zone?: string;
  year?: number;
  is_default?: boolean;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  event_count?: number; // Added for API response
}

export interface EventDatabase {
  id: string;
  mongo_id: string;
  created_by: string;
  event_number: string;
  title: string;
  description: string;
  people_count: number;
  people_names: string[];
  excluded_areas: string;
  start_date: string;
  end_date: string;
  send_reminder_to_complete_at: string;
  start_time: string;
  end_time: string;
  year: number;
  duration: number;
  thumbnails: string[];
  amount: number;
  median_price_booked: number;
  price_percentile_90: number;
  taxable_amount: number;
  transaction_id: string;
  is_tax_amount_paid: boolean;
  add_to_my_calendar: boolean;
  added_in_calendar: boolean;
  is_completed_event: boolean;
  is_send_event_to_ca: boolean;
  is_free_event_earned: boolean;
  is_applied_code: boolean;
  promo_code_id: string;
  rental_agreement_id: string;
  rental_address_id: string;
  business_address_id: string;
  is_draft: boolean;
  is_posted: boolean;
  created_at: string;
  updated_at: string;
  money_paid_to_personal: boolean;
}

type ProposalFormType = "Reimbursement_Plan" | "Rental_Agreement";

export interface ProposalDatabase {
  id: string; // uuid
  mongo_id?: string | null;
  envelope_id?: string | null;
  recipient_id?: string | null;
  business_recipient_id?: string | null;
  document_id?: number | null;
  is_signature_done?: boolean | null;
  is_business_signature_done?: boolean | null;
  is_mail_sent_to_business?: boolean | null;
  is_mail_sent_to_user?: boolean | null;
  signature_doc_url?: string | null;
  business_token_data?: {
    token: string | null;
    last_generated: string | null; // ISO date in JSON
  } | null;
  user_token_data?: {
    token: string | null;
    last_generated: string | null; // ISO date in JSON
  } | null;
  proposal_id?: string | null;
  year?: number | null;
  created_by?: string | null; // uuid
  form_type?: ProposalFormType | null;
  event_number?: number | null;
  rental_address_id?: string | null; // uuid
  business_address_id?: string | null; // uuid
  is_manual_agreement?: boolean | null;
  created_at?: string | null; // ISO timestamp with timezone
  updated_at?: string | null; // ISO timestamp with timezone
  event_id?: string | null; // uuid
}

export interface EventDatabaseWithAllData extends EventDatabase {
  defendability_scores: {
    id: string;
    created_at: string;
    updated_at: string;
    more_people: boolean;
    money_paid_to_personnel: boolean;
    more_duration: boolean;
    digital_valuation: boolean;
    written_notes: boolean;
    evidence_supporting: boolean;
  };
  event_documents: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    created_at: string;
  }[];
  daily_amounts: {
    id: string;
    date: string;
    amount: number;
    created_at: string;
  }[];
  event_invoices: {
    id: string;
    url: string;
    date: string;
    number: string;
    created_at: string;
  };
  rental_address: UserAddress & {
    is_custom_plan: boolean;
    avarage_value: number;
  };
  residence: string;
  business_address: UserAddress;
  rental_agreement: ProposalDatabase;
}

export interface EventFormData {
  residence: string;
  title: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  start_time: string; // Time string (HH:MM)
  end_time: string; // Time string (HH:MM)
  people_count: string;
  rental_amount: string;
  description: string;
  manual_valuation: boolean;
  money_paid_to_personal: boolean;
  event_documents: ExistingFile[];
  excluded_areas: string;
  thumbnails: string[];
  upload_thumbnails: File[];
}

export interface FutureDailyPricingDay {
  id: string;
  future_daily_pricing_id: string;
  date: string;
  price_percentile_90: number;
  median_price_booked: number;
  created_at: string;
}

type PlanType = "Basic" | "Plus" | "Premium";

export interface PlanDatabase {
  id: string;
  mongo_id?: string | null;
  plan_type?: PlanType | null;
  plan_code?: string | null;
  title?: string | null;
  description?: string | null;
  amount?: number | null;
  amount_description?: string | null;
  allow_no_of_rental_address?: number | null;
  allow_to_create_template?: boolean | null;
  allow_to_create_draft?: boolean | null;
  is_allowed_personally_vetted?: boolean | null;
  is_digital_valuation_allow?: boolean | null;
  offering?: Record<string, string>[] | null;
  additional_offering?: Record<string, string>[] | null;
  is_active?: boolean | null;
  no_of_days?: number | null;
  is_trial_allowed?: boolean | null;
  trail_draft_allow?: number | null;
  no_of_trial_days?: number | null;
  created_at?: string | null; // ISO timestamp
  updated_at?: string | null; // ISO timestamp
}

export interface DefendabilityScoreDatabase {
  id: string;
  event_id: string;
  written_notes?: boolean | null;
  digital_valuation?: boolean | null;
  evidence_supporting?: boolean | null;
  more_people?: boolean | null;
  money_paid_to_personnel?: boolean | null;
  more_duration?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DailyAmountDatabase {
  id: string;
  event_id: string;
  date?: string | null; // ISO timestamp
  amount?: number | null; // numeric(10,2)
  created_at?: string | null; // ISO timestamp
}

export interface EventTemplateDatabase {
  id: string; // uuid
  mongo_id: string;
  created_by: string; // uuid
  draft_name?: string | null;
  title?: string | null;
  is_used_as_template?: boolean | null;
  description?: string | null;
  people_count?: number | null;
  people_names?: string[] | null;
  excluded_areas?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  amount?: number | null; // numeric(10,2)
  is_manual_valuation?: boolean | null;
  add_to_my_calendar?: boolean | null;
  created_at?: string | null; // ISO timestamp with timezone
  updated_at?: string | null; // ISO timestamp with timezone
}

export interface UserNotificationSettings {
  id: string;
  user_id: string;
  pre_event_email_notifications?: boolean | null;
  during_event_email_notifications?: boolean | null;
  post_event_email_notifications?: boolean | null;
  high_upcoming_rental_event_price?: boolean | null;
  using_the_app_tax_pro?: boolean | null;
  tax_code_questions?: boolean | null;
  annual_filing?: boolean | null;
  best_practices_posts?: boolean | null;
  money_savings_posts?: boolean | null;
  tax_law_posts?: boolean | null;
  time_savings_posts?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserNotificationCategory {
  id: string;
  user_id: string;
  category_id?: string | null;
  created_at?: string | null;
}
