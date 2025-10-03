// Custom Plans Types for PostgreSQL Schema Migration

import { UserAddress } from ".";

type CustomPlanStatus = "ACTIVE" | "INACTIVE";

export type CustomPlan = {
  id: string; // uuid
  mongo_id: string;
  status: CustomPlanStatus | null;
  user_id: string | null;
  created_at: string | null; // ISO timestamp
  updated_at: string | null; // ISO timestamp
};

/**
 * Residence interface matching PostgreSQL schema
 */
export interface Residence {
  id: string;
  custom_plan_id: string;
  nick_name: string | null;
  tar_fee_percent: number;
  event_days: number;
  tar_fee_amount: number;
  average_value: number;
  total_value: number;
  tax_savings: number;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  comps: Comp[];
  address?: UserAddress | null;
}

/**
 * Comp interface matching PostgreSQL schema
 */
export interface Comp {
  id: string;
  residence_id: string;
  daily_rental_amount: number;
  location: string;
  distance_from_residence: string;
  square_footage: number;
  bedrooms: number | null;
  bathrooms: number | null;
  website_link: string | null;
  file: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * API Response interface for custom plans endpoint
 */
export interface CustomPlansResponse {
  success: boolean;
  data: CustomPlanWithDetails[];
  pagination: PaginationInfo;
}

/**
 * Pagination information interface
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Filter and search parameter interfaces
 */
export interface CustomPlanFilters {
  search: string;
  status: "all" | "active" | "inactive";
  page: number;
  limit: number;
}

/**
 * Parameters for useCustomPlans hook
 */
export interface UseCustomPlansParams {
  page?: number;
  filters?: Partial<CustomPlanFilters>;
  enabled?: boolean;
}

/**
 * Database row interface for custom plans query results
 */
export interface CustomPlanDatabaseRow {
  id: string;
  mongo_id: string;
  status: "ACTIVE" | "INACTIVE";
  user_id: string | null;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  residence_count: number;
  total_tar_amount: string; // Comes as string from database
}

/**
 * API Error response interface
 */
export interface CustomPlansErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * Filter status options
 */
export type FilterStatus = "all" | "active" | "inactive";

/**
 * Sort options for custom plans
 */
export interface CustomPlanSortOptions {
  field: "created_at" | "status" | "total_tar_amount" | "residence_count";
  direction: "asc" | "desc";
}

/**
 * Extended custom plan interface with additional computed fields
 */
export interface CustomPlanWithMetrics extends CustomPlan {
  formatted_total_tar_amount: string;
  formatted_created_date: string;
  customer_display_name: string;
}

/**
 * Request parameters for custom plans API
 */
export interface CustomPlansRequestParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FilterStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

/**
 * Database response types for Supabase queries
 */
export interface DatabaseUserProfile {
  first_name: string;
  last_name: string;
  email: string;
}

export interface DatabaseAddress {
  id: string;
  mongo_id: string;
  address_type: string | null;
  business_name: string | null;
  business_phone_code: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_entity_type: string | null;
  business_nature: string | null;
  is_home_office_deduction: boolean | null;
  tax_filing_status: string | null;
  estimated_income: number | null;
  nickname: string | null;
  street: string | null;
  description: string | null;
  apartment: string | null;
  county: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  time_zone: string | null;
  year: number | null;
  is_default: boolean | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseComp {
  id: string;
  residence_id: string;
  daily_rental_amount: number;
  location: string;
  distance_from_residence: string;
  square_footage: number;
  bedrooms: number | null;
  bathrooms: number | null;
  website_link: string | null;
  file: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseResidence {
  id: string;
  custom_plan_id: string;
  nick_name: string | null;
  tar_fee_percent: number;
  event_days: number;
  tar_fee_amount: number;
  average_value: number;
  total_value: number;
  tax_savings: number;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  user_addresses: DatabaseAddress | DatabaseAddress[];
  comps: DatabaseComp[];
}

export interface DatabaseCustomPlan {
  id: string;
  mongo_id: string;
  status: "ACTIVE" | "INACTIVE";
  user_id: string | null;
  created_at: string;
  updated_at: string;
  user_profile: DatabaseUserProfile | DatabaseUserProfile[];
  residences: DatabaseResidence[];
}

/**
 * Extended Custom Plan interface with user profile and residences
 */
export interface CustomPlanWithDetails extends CustomPlan {
  user_profile: DatabaseUserProfile | null;
  residences: Residence[];
  total_tar_amount: number;
  residence_count: number;
}
