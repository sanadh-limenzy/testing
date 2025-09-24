import { UserProfile } from "./user";


export interface SubscriberUserResponse {
  success: boolean;
  data: {
    user_profile: UserProfile;
  };
}

// Rental Property Types
export interface RentalAddress {
  id: string;
  mongo_id?: string;
  address_type: string;
  business_name?: string;
  business_phone_code?: string;
  business_phone?: string;
  business_email?: string;
  business_entity_type?: string;
  business_nature?: string;
  is_home_office_deduction: boolean;
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
  is_default: boolean;
  is_active: boolean;
  is_deleted: boolean;
  number_of_days_used: number;
  created_at: string;
  updated_at: string;
}