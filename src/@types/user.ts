export interface UserProfile {
  id: string;
  email: string;
  mongo_id?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  is_select_profile_pic?: boolean;
  dob_date?: number;
  dob_month?: number;
  dob_year?: number;
  username?: string;
  phone_code?: string;
  phone?: string;
  is_active: boolean;
  user_type: string;
  token_expired?: boolean;
  customer_stripe_id?: string;
  vendor_stripe_id?: string;
  referral_tier?: number;
  referral_percent?: number;
  referral_code?: string;
  referred_by?: string;
  commission_earnings?: number;
  commission_percentage_level1?: number;
  commission_percentage_level2?: number;
  referred_clients_count?: number;
  referred_affiliate_count?: number;
  is_eligible_to_refer_clients?: boolean;
  is_eligible_to_refer_affiliates?: boolean;
  referral_sent?: number;
  is_add_card?: boolean;
  has_bank?: boolean;
  bank_account_number?: string;
  bank_routing_number?: string;
  payment_enabled?: boolean;
  payout_enabled?: boolean;
  last_kyc_submitted?: string;
  otp?: string;
  otp_send_to?: string;
  otp_last_generated?: string;
  forgot_password_token?: string;
  forgot_password_requested_at?: string;
  forgot_password_expires_at?: string;
  device_tokens?: string[];
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  time_zone?: string;
  created_at: string;
  updated_at: string;
  subscriber_profile: SubscriberProfile;
}

export interface SubscriberProfile {
  id: string;
  user_id: string;
  business_name?: string;
  legal_business_name?: string;
  business_website?: string;
  business_phone_code?: string;
  business_phone?: string;
  business_email?: string;
  business_entity_type?: string;
  business_nature?: string;
  years_in_business?: number;
  ssn?: number;
  tax_ein?: number;
  accountant_id?: string;
  referral_balance?: number;
  active_step?: number;
  rental_amount?: number;
  free_event_earned?: number;
  is_update_info?: boolean;
  request_packet_at?: string;
  request_accepted?: boolean;
  invited_by_vendor?: boolean;
  vendor_id?: string;
  subscription_basic_rate?: number;
  plan_id?: string;
  plan_start_date?: string;
  plan_end_date?: string;
  current_plan_active_year?: string;
  is_subscription_active?: boolean;
  is_free_subscription_active?: boolean;
  free_trial_start_date?: string;
  free_trial_end_date?: string;
  is_one_time_purchase?: boolean;
  is_send_one_time_purchase_email?: boolean;
  is_auto_renew_subscription?: boolean;
  is_manual_valuation?: boolean;
  is_trial_allowed?: boolean;
  last_subscription_reminder?: string;
  is_tax_pro_email_reminder_send?: boolean;
  is_already_have_reimbursement_plan?: boolean;
  is_custom_plan?: boolean;
  accounts_payable_email?: string;
  allow_no_of_rental_address?: number;
  allow_to_create_template?: boolean;
  allow_to_create_draft?: boolean;
  is_allowed_personally_vetted?: boolean;
  is_digital_valuation_allow?: boolean;
  is_success_call?: boolean;
  is_schedule_14?: boolean;
  is_everything_bundle?: boolean;
  is_add_another_residence?: boolean;
  is_audit_coverage?: boolean;
  is_better_bundle?: boolean;
  event_tax_percentage?: number;
  is_feedback_done?: boolean;
  created_at: string;
  updated_at: string;
  reimbursement_plan_id?: string;
  custom_plan_id?: string;
}

export interface AccountantProfile {
  id: string; // uuid
  user_id: string; // uuid
  business_name?: string | null;
  business_entity_type?: string | null;
  request_accepted?: boolean | null; // default: false
  invited_by_admin?: boolean | null; // default: false
  total_client_count?: number | null; // default: 0
  created_at?: string | null; // timestamp with time zone
  updated_at?: string | null; // timestamp with time zone
}
