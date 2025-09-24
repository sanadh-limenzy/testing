create table public.accountant_clients (
  id uuid not null default gen_random_uuid (),
  accountant_id uuid not null,
  client_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint accountant_clients_pkey primary key (id),
  constraint fk_accountant_clients_accountant foreign KEY (accountant_id) references accountant_profile (id) on delete CASCADE,
  constraint fk_accountant_clients_client foreign KEY (client_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_accountant_clients_accountant on public.accountant_clients using btree (accountant_id) TABLESPACE pg_default;

create index IF not exists idx_accountant_clients_client on public.accountant_clients using btree (client_id) TABLESPACE pg_default;


create table public.accountant_profile (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  business_name character varying(255) null,
  business_entity_type character varying(255) null,
  request_accepted boolean null default false,
  invited_by_admin boolean null default false,
  total_client_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint accountant_profile_pkey primary key (id),
  constraint accountant_profile_user_id_key unique (user_id),
  constraint fk_accountant_profile_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_accountant_profile_user on public.accountant_profile using btree (user_id) TABLESPACE pg_default;



create table public.admin_profile (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  company_position character varying(255) null,
  is_super_admin boolean null default false,
  allow_all_access boolean null default false,
  show_valuation_queue boolean null default false,
  show_clients boolean null default false,
  show_affiliates boolean null default false,
  show_vendors boolean null default false,
  show_documents boolean null default false,
  show_transactions boolean null default false,
  show_accountants boolean null default false,
  show_promocodes boolean null default false,
  show_feedback boolean null default false,
  show_education boolean null default false,
  show_reviews boolean null default false,
  show_records boolean null default false,
  show_referrals boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint admin_profile_pkey primary key (id),
  constraint admin_profile_user_id_key unique (user_id),
  constraint fk_admin_profile_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_admin_profile_user on public.admin_profile using btree (user_id) TABLESPACE pg_default;



create table public.comps (
  id uuid not null default gen_random_uuid (),
  residence_id uuid not null,
  daily_rental_amount numeric(15, 2) not null,
  location character varying(255) not null,
  distance_from_residence character varying(255) not null,
  square_footage integer not null,
  bedrooms integer null,
  bathrooms integer null,
  website_link text null,
  file text null,
  notes text null,
  is_active boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint comps_pkey primary key (id),
  constraint fk_comps_residence foreign KEY (residence_id) references residences (id) on delete CASCADE,
  constraint comps_bathrooms_check check ((bathrooms >= 0)),
  constraint comps_bedrooms_check check ((bedrooms >= 0)),
  constraint comps_daily_rental_amount_check check ((daily_rental_amount >= (0)::numeric)),
  constraint comps_square_footage_check check ((square_footage > 0))
) TABLESPACE pg_default;

create index IF not exists idx_comps_residence_id on public.comps using btree (residence_id) TABLESPACE pg_default;

create index IF not exists idx_comps_location on public.comps using btree (location) TABLESPACE pg_default;

create index IF not exists idx_comps_is_active on public.comps using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_comps_daily_rental_amount on public.comps using btree (daily_rental_amount) TABLESPACE pg_default;

create index IF not exists idx_comps_square_footage on public.comps using btree (square_footage) TABLESPACE pg_default;



create table public.custom_plans (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) not null,
  status character varying(20) null default 'INACTIVE'::character varying,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint custom_plans_pkey primary key (id),
  constraint custom_plans_mongo_id_key unique (mongo_id),
  constraint custom_plans_user_id_fkey foreign KEY (user_id) references user_profile (id) on delete set null,
  constraint custom_plans_status_check check (
    (
      (status)::text = any (
        (
          array[
            'ACTIVE'::character varying,
            'INACTIVE'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_custom_plans_mongo_id on public.custom_plans using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_custom_plans_status on public.custom_plans using btree (status) TABLESPACE pg_default;

create index IF not exists idx_custom_plans_user_id on public.custom_plans using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_custom_plans_created_at on public.custom_plans using btree (created_at) TABLESPACE pg_default;



create table public.daily_amounts (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  date timestamp with time zone null,
  amount numeric(10, 2) null,
  created_at timestamp with time zone null default now(),
  constraint daily_amounts_pkey primary key (id),
  constraint fk_daily_amounts_event foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_daily_amounts_event_id on public.daily_amounts using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_daily_amounts_date on public.daily_amounts using btree (date) TABLESPACE pg_default;



create table public.defendability_scores (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  written_notes boolean null default false,
  digital_valuation boolean null default false,
  evidence_supporting boolean null default false,
  more_people boolean null default false,
  money_paid_to_personnel boolean null default false,
  more_duration boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint defendability_scores_pkey primary key (id),
  constraint fk_defendability_scores_event foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_defendability_scores_event_id on public.defendability_scores using btree (event_id) TABLESPACE pg_default;



create table public.event_documents (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  name character varying(255) null,
  url text null,
  type character varying(50) null,
  size integer null,
  created_at timestamp with time zone null default now(),
  constraint event_documents_pkey primary key (id),
  constraint fk_event_documents_event foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_documents_event_id on public.event_documents using btree (event_id) TABLESPACE pg_default;



create table public.event_invoices (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  number character varying(255) null,
  url text null,
  date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_invoices_pkey primary key (id),
  constraint fk_event_invoices_event foreign KEY (event_id) references events (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_invoices_event_id on public.event_invoices using btree (event_id) TABLESPACE pg_default;



create table public.event_templates (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) not null,
  created_by uuid not null,
  draft_name character varying(255) null,
  title character varying(255) null,
  is_used_as_template boolean null default false,
  description text null,
  people_count integer null default 0,
  people_names text[] null default '{}'::text[],
  excluded_areas text null,
  start_time character varying(50) null,
  end_time character varying(50) null,
  amount numeric(10, 2) null,
  is_manual_valuation boolean null default false,
  add_to_my_calendar boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_templates_pkey primary key (id),
  constraint event_templates_mongo_id_key unique (mongo_id),
  constraint fk_event_templates_created_by foreign KEY (created_by) references user_profile (id) on delete set null,
  constraint chk_amount_positive check (
    (
      (amount is null)
      or (amount >= (0)::numeric)
    )
  ),
  constraint chk_people_count_positive check ((people_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_event_templates_mongo_id on public.event_templates using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_event_templates_created_by on public.event_templates using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_event_templates_draft_name on public.event_templates using btree (draft_name) TABLESPACE pg_default;

create index IF not exists idx_event_templates_title on public.event_templates using btree (title) TABLESPACE pg_default;

create index IF not exists idx_event_templates_is_used_as_template on public.event_templates using btree (is_used_as_template) TABLESPACE pg_default;

create index IF not exists idx_event_templates_created_at on public.event_templates using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_event_templates_created_by_template on public.event_templates using btree (created_by, is_used_as_template) TABLESPACE pg_default;



create table public.events (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  created_by uuid null,
  event_number integer null,
  title character varying(255) null,
  description text null,
  people_count integer null,
  people_names text[] null default '{}'::text[],
  excluded_areas text null,
  date timestamp with time zone null,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  send_reminder_to_complete_at timestamp with time zone null,
  start_time character varying(50) null,
  end_time character varying(50) null,
  year integer null,
  duration numeric(10, 2) null,
  thumbnails text[] null default '{}'::text[],
  amount numeric(10, 2) null,
  median_price_booked numeric(10, 2) null,
  price_percentile_90 numeric(10, 2) null,
  taxable_amount numeric(10, 2) null,
  transaction_id character varying(255) null,
  is_tax_amount_paid boolean null default false,
  add_to_my_calendar boolean null default false,
  added_in_calendar boolean null default false,
  is_completed_event boolean null default false,
  is_send_event_to_ca boolean null default false,
  is_free_event_earned boolean null default false,
  is_applied_code boolean null default false,
  promo_code_id uuid null,
  rental_agreement_id uuid null,
  rental_address_id uuid null,
  business_address_id uuid null,
  is_draft boolean null default false,
  is_posted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id),
  constraint events_mongo_id_key unique (mongo_id),
  constraint events_created_by_fkey foreign KEY (created_by) references user_profile (id) on delete set null,
  constraint events_business_address_id_fkey foreign KEY (business_address_id) references user_addresses (id) on delete set null,
  constraint events_promo_code_id_fkey foreign KEY (promo_code_id) references promo_codes (id) on delete set null,
  constraint events_rental_address_id_fkey foreign KEY (rental_address_id) references user_addresses (id) on delete set null,
  constraint events_rental_agreement_id_fkey foreign KEY (rental_agreement_id) references proposals (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_events_mongo_id on public.events using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_events_created_by on public.events using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_events_promo_code_id on public.events using btree (promo_code_id) TABLESPACE pg_default;

create index IF not exists idx_events_transaction_id on public.events using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_events_rental_agreement_id on public.events using btree (rental_agreement_id) TABLESPACE pg_default;

create index IF not exists idx_events_rental_address_id on public.events using btree (rental_address_id) TABLESPACE pg_default;

create index IF not exists idx_events_business_address_id on public.events using btree (business_address_id) TABLESPACE pg_default;

create index IF not exists idx_events_date on public.events using btree (date) TABLESPACE pg_default;

create index IF not exists idx_events_start_date on public.events using btree (start_date) TABLESPACE pg_default;

create index IF not exists idx_events_event_number on public.events using btree (event_number) TABLESPACE pg_default;



create table public.plans (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  plan_type character varying(20) null,
  plan_code character varying(255) null,
  title character varying(255) null,
  description text null,
  amount numeric(10, 2) null,
  amount_description character varying(255) null,
  allow_no_of_rental_address integer null default 1,
  allow_to_create_template boolean null default false,
  allow_to_create_draft boolean null default false,
  is_allowed_personally_vetted boolean null default false,
  is_digital_valuation_allow boolean null default false,
  offering jsonb null default '[]'::jsonb,
  additional_offering jsonb null default '[]'::jsonb,
  is_active boolean null default true,
  no_of_days integer null,
  is_trial_allowed boolean null default false,
  trail_draft_allow integer null,
  no_of_trial_days integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint plans_pkey primary key (id),
  constraint plans_mongo_id_key unique (mongo_id),
  constraint plans_plan_type_check check (
    (
      (plan_type)::text = any (
        (
          array[
            'Basic'::character varying,
            'Plus'::character varying,
            'Premium'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_plans_mongo_id on public.plans using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_plans_plan_type on public.plans using btree (plan_type) TABLESPACE pg_default;

create index IF not exists idx_plans_plan_code on public.plans using btree (plan_code) TABLESPACE pg_default;

create index IF not exists idx_plans_is_active on public.plans using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_plans_created_at on public.plans using btree (created_at) TABLESPACE pg_default;




create table public.promo_code_allowed_plans (
  id uuid not null default gen_random_uuid (),
  promo_code_id uuid not null,
  plan_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint promo_code_allowed_plans_pkey primary key (id),
  constraint promo_code_allowed_plans_promo_code_id_plan_id_key unique (promo_code_id, plan_id),
  constraint fk_promo_code_allowed_plans_promo_code foreign KEY (promo_code_id) references promo_codes (id) on delete CASCADE,
  constraint promo_code_allowed_plans_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_promo_code_allowed_plans_promo_code_id on public.promo_code_allowed_plans using btree (promo_code_id) TABLESPACE pg_default;

create index IF not exists idx_promo_code_allowed_plans_plan_id on public.promo_code_allowed_plans using btree (plan_id) TABLESPACE pg_default;




create table public.promo_code_used_by (
  id uuid not null default gen_random_uuid (),
  promo_code_id uuid not null,
  user_id uuid null,
  used_at timestamp with time zone null default now(),
  constraint promo_code_used_by_pkey primary key (id),
  constraint promo_code_used_by_promo_code_id_user_id_key unique (promo_code_id, user_id),
  constraint fk_promo_code_used_by_promo_code foreign KEY (promo_code_id) references promo_codes (id) on delete CASCADE,
  constraint promo_code_used_by_user_id_fkey foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_promo_code_used_by_promo_code_id on public.promo_code_used_by using btree (promo_code_id) TABLESPACE pg_default;

create index IF not exists idx_promo_code_used_by_user_id on public.promo_code_used_by using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_promo_code_used_by_used_at on public.promo_code_used_by using btree (used_at) TABLESPACE pg_default;



create table public.promo_codes (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  created_by uuid null,
  is_plant_specific boolean null default false,
  promo_type character varying(20) null,
  promo_for text[] null default '{}'::text[],
  is_unlimited_promo boolean null default false,
  no_of_promo_allow_to_used integer null,
  used_by_count integer null default 0,
  name character varying(255) null,
  code character varying(255) null,
  is_flat_discount boolean null default false,
  discount_amount numeric(10, 2) null,
  discount_percent numeric(5, 2) null,
  start_at timestamp with time zone null,
  expire_at timestamp with time zone null,
  is_delete_after_use boolean null default false,
  is_one_time_user boolean null default false,
  is_active boolean null default false,
  is_delete boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint promo_codes_pkey primary key (id),
  constraint promo_codes_mongo_id_key unique (mongo_id),
  constraint promo_codes_created_by_fkey foreign KEY (created_by) references user_profile (id) on delete set null,
  constraint promo_codes_promo_type_check check (
    (
      (promo_type)::text = any (
        (
          array[
            'All'::character varying,
            'Individual'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_mongo_id on public.promo_codes using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_created_by on public.promo_codes using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_code on public.promo_codes using btree (code) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_promo_type on public.promo_codes using btree (promo_type) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_is_active on public.promo_codes using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_is_delete on public.promo_codes using btree (is_delete) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_start_at on public.promo_codes using btree (start_at) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_expire_at on public.promo_codes using btree (expire_at) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_created_at on public.promo_codes using btree (created_at) TABLESPACE pg_default;




create table public.proposals (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  envelope_id character varying(255) null,
  recipient_id character varying(255) null,
  business_recipient_id character varying(255) null,
  document_id integer null,
  is_signature_done boolean null default false,
  is_business_signature_done boolean null default false,
  is_mail_sent_to_business boolean null default false,
  is_mail_sent_to_user boolean null default false,
  signature_doc_url text null,
  business_token_data jsonb null default '{"token": null, "last_generated": null}'::jsonb,
  user_token_data jsonb null default '{"token": null, "last_generated": null}'::jsonb,
  proposal_id character varying(255) null,
  year integer null,
  created_by uuid null,
  form_type character varying(50) null,
  event_number integer null,
  rental_address_id uuid null,
  business_address_id uuid null,
  is_manual_agreement boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  event_id uuid null,
  constraint proposals_pkey primary key (id),
  constraint proposals_mongo_id_key unique (mongo_id),
  constraint fk_proposals_event foreign KEY (event_id) references events (id) on delete set null,
  constraint fk_proposals_business_address foreign KEY (business_address_id) references user_addresses (id) on delete set null,
  constraint fk_proposals_rental_address foreign KEY (rental_address_id) references user_addresses (id) on delete set null,
  constraint fk_proposals_created_by foreign KEY (created_by) references user_profile (id) on delete set null,
  constraint proposals_form_type_check check (
    (
      (form_type)::text = any (
        (
          array[
            'Reimbursement_Plan'::character varying,
            'Rental_Agreement'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_proposals_mongo_id on public.proposals using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_envelope_id on public.proposals using btree (envelope_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_recipient_id on public.proposals using btree (recipient_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_business_recipient_id on public.proposals using btree (business_recipient_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_document_id on public.proposals using btree (document_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_proposal_id on public.proposals using btree (proposal_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_year on public.proposals using btree (year) TABLESPACE pg_default;

create index IF not exists idx_proposals_created_by on public.proposals using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_proposals_form_type on public.proposals using btree (form_type) TABLESPACE pg_default;

create index IF not exists idx_proposals_event_number on public.proposals using btree (event_number) TABLESPACE pg_default;

create index IF not exists idx_proposals_rental_address_id on public.proposals using btree (rental_address_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_business_address_id on public.proposals using btree (business_address_id) TABLESPACE pg_default;

create index IF not exists idx_proposals_created_at on public.proposals using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_proposals_event_id on public.proposals using btree (event_id) TABLESPACE pg_default;




create table public.residences (
  id uuid not null default gen_random_uuid (),
  custom_plan_id uuid not null,
  nick_name character varying(255) null,
  tar_fee_percent numeric(5, 2) not null,
  event_days integer not null,
  tar_fee_amount numeric(15, 2) not null,
  average_value numeric(15, 2) not null,
  total_value numeric(15, 2) not null,
  tax_savings numeric(15, 2) not null,
  address_id character varying(255) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint residences_pkey primary key (id),
  constraint fk_residences_custom_plan foreign KEY (custom_plan_id) references custom_plans (id) on delete CASCADE,
  constraint residences_event_days_check check (
    (
      (event_days >= 1)
      and (event_days <= 365)
    )
  ),
  constraint residences_tar_fee_amount_check check ((tar_fee_amount >= 0.01)),
  constraint residences_tar_fee_percent_check check (
    (
      (tar_fee_percent >= 0.01)
      and (tar_fee_percent <= 99.99)
    )
  ),
  constraint residences_tax_savings_check check ((tax_savings >= 0.01)),
  constraint residences_total_value_check check ((total_value >= 0.01)),
  constraint residences_average_value_check check ((average_value >= 0.01))
) TABLESPACE pg_default;

create index IF not exists idx_residences_custom_plan_id on public.residences using btree (custom_plan_id) TABLESPACE pg_default;

create index IF not exists idx_residences_address_id on public.residences using btree (address_id) TABLESPACE pg_default;

create index IF not exists idx_residences_nick_name on public.residences using btree (nick_name) TABLESPACE pg_default;

create index IF not exists idx_residences_tar_fee_percent on public.residences using btree (tar_fee_percent) TABLESPACE pg_default;

create index IF not exists idx_residences_total_value on public.residences using btree (total_value) TABLESPACE pg_default;



create table public.subscriber_profile (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  business_name character varying(255) null,
  legal_business_name character varying(255) null,
  business_website character varying(255) null,
  business_phone_code character varying(10) null,
  business_phone character varying(20) null,
  business_email character varying(255) null,
  business_entity_type character varying(255) null,
  business_nature character varying(255) null,
  years_in_business integer null,
  ssn integer null,
  tax_ein integer null,
  accountant_id uuid null,
  referral_balance numeric(15, 2) null default 0,
  active_step integer null default 1,
  rental_amount numeric(15, 2) null,
  free_event_earned integer null default 0,
  is_update_info boolean null default false,
  request_packet_at timestamp with time zone null,
  request_accepted boolean null default false,
  invited_by_vendor boolean null default false,
  vendor_id character varying(255) null,
  subscription_basic_rate numeric(15, 2) null,
  plan_id uuid null,
  plan_start_date timestamp with time zone null,
  plan_end_date timestamp with time zone null,
  current_plan_active_year character varying(4) null,
  is_subscription_active boolean null default false,
  is_free_subscription_active boolean null default false,
  free_trial_start_date timestamp with time zone null,
  free_trial_end_date timestamp with time zone null,
  is_one_time_purchase boolean null default false,
  is_send_one_time_purchase_email boolean null default false,
  is_auto_renew_subscription boolean null default false,
  is_manual_valuation boolean null default false,
  is_trial_allowed boolean null default true,
  last_subscription_reminder timestamp with time zone null,
  is_tax_pro_email_reminder_send boolean null default false,
  is_already_have_reimbursement_plan boolean null default false,
  is_custom_plan boolean null default false,
  custom_plan_id character varying(255) null,
  accounts_payable_email character varying(255) null,
  allow_no_of_rental_address integer null,
  allow_to_create_template boolean null default false,
  allow_to_create_draft boolean null default false,
  is_allowed_personally_vetted boolean null default false,
  is_digital_valuation_allow boolean null default false,
  is_success_call boolean null default false,
  is_schedule_14 boolean null default false,
  is_everything_bundle boolean null default false,
  is_add_another_residence boolean null default false,
  is_audit_coverage boolean null default false,
  is_better_bundle boolean null default false,
  event_tax_percentage numeric(5, 2) null default 4,
  is_feedback_done boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  reimbursement_plan_id uuid null,
  constraint subscriber_profile_pkey primary key (id),
  constraint subscriber_profile_user_id_key unique (user_id),
  constraint fk_subscriber_profile_reimbursement_plan foreign KEY (reimbursement_plan_id) references proposals (id) on delete set null,
  constraint fk_subscriber_profile_accountant foreign KEY (accountant_id) references accountant_profile (id) on delete set null,
  constraint subscriber_profile_plan_id_fkey foreign KEY (plan_id) references plans (id),
  constraint fk_subscriber_profile_user foreign KEY (user_id) references user_profile (id) on delete CASCADE,
  constraint fk_subscriber_profile_plan foreign KEY (plan_id) references plans (id)
) TABLESPACE pg_default;

create index IF not exists idx_subscriber_profile_user on public.subscriber_profile using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_subscriber_profile_plan on public.subscriber_profile using btree (plan_id) TABLESPACE pg_default;

create index IF not exists idx_subscriber_profile_reimbursement_plan_id on public.subscriber_profile using btree (reimbursement_plan_id) TABLESPACE pg_default;



create table public.subscriber_promo_codes (
  id uuid not null default gen_random_uuid (),
  subscriber_id uuid not null,
  promo_code character varying(255) null,
  created_at timestamp with time zone null default now(),
  constraint subscriber_promo_codes_pkey primary key (id),
  constraint fk_subscriber_promo_codes_subscriber foreign KEY (subscriber_id) references subscriber_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subscriber_promo_codes_subscriber on public.subscriber_promo_codes using btree (subscriber_id) TABLESPACE pg_default;



create table public.subscriber_tax_brackets (
  id uuid not null default gen_random_uuid (),
  subscriber_id uuid not null,
  tax_bracket_id character varying(255) null,
  created_at timestamp with time zone null default now(),
  constraint subscriber_tax_brackets_pkey primary key (id),
  constraint fk_subscriber_tax_brackets_subscriber foreign KEY (subscriber_id) references subscriber_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subscriber_tax_brackets_subscriber on public.subscriber_tax_brackets using btree (subscriber_id) TABLESPACE pg_default;



create table public.subscriber_tax_years (
  id uuid not null default gen_random_uuid (),
  subscriber_id uuid not null,
  year integer null,
  created_at timestamp with time zone null default now(),
  is_send_packet boolean null default false,
  is_send_packet_dump boolean null default false,
  is_accept_legal_disclosure boolean null default false,
  is_accept_i_qualify boolean null default false,
  send_packet_at timestamp with time zone null,
  send_packet_id character varying(255) null,
  constraint subscriber_tax_years_pkey primary key (id),
  constraint fk_subscriber_tax_years_subscriber foreign KEY (subscriber_id) references subscriber_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subscriber_tax_years_subscriber on public.subscriber_tax_years using btree (subscriber_id) TABLESPACE pg_default;

create index IF not exists idx_subscriber_tax_years_year on public.subscriber_tax_years using btree (year) TABLESPACE pg_default;



create table public.transaction_transfer_details (
  id uuid not null default gen_random_uuid (),
  transaction_id uuid not null,
  to_user_id uuid null,
  stripe_id character varying(255) null,
  commission_percentage numeric(5, 2) null default 0,
  amount numeric(15, 2) null default 0,
  user_type character varying(50) null,
  referred_to_user_type character varying(50) null,
  transfer_response_id character varying(255) null,
  is_refunded boolean null default false,
  reason text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transaction_transfer_details_pkey primary key (id),
  constraint fk_transaction_transfer_details_transaction foreign KEY (transaction_id) references transactions (id) on delete CASCADE,
  constraint transaction_transfer_details_to_user_id_fkey foreign KEY (to_user_id) references user_profile (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_transfer_details_transaction_id on public.transaction_transfer_details using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_transfer_details_to_user_id on public.transaction_transfer_details using btree (to_user_id) TABLESPACE pg_default;

create index IF not exists idx_transfer_details_stripe_id on public.transaction_transfer_details using btree (stripe_id) TABLESPACE pg_default;

create index IF not exists idx_transfer_details_is_refunded on public.transaction_transfer_details using btree (is_refunded) TABLESPACE pg_default;


create table public.transactions (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  transaction_id character varying(255) null,
  description text null,
  payment_type character varying(50) null,
  plan_id uuid null,
  plan_type character varying(20) null,
  plan_title character varying(255) null,
  promo_code character varying(255) null,
  is_applied_code boolean null default false,
  promo_code_id uuid null,
  event_id uuid null,
  rental_address_id uuid null,
  is_trial_transaction boolean null default false,
  plan_amount numeric(15, 2) null default 0,
  wallet_discount_amount numeric(15, 2) null default 0,
  promo_discount_amount numeric(15, 2) null default 0,
  amount numeric(15, 2) null default 0,
  tax_amount numeric(15, 2) null default 0,
  transaction_date timestamp with time zone null default now(),
  require_transfer boolean null default false,
  transfer_group character varying(255) null,
  user_id uuid null,
  status character varying(20) null default 'pending'::character varying,
  is_refunded boolean null default false,
  refunded_by uuid null,
  reason text null,
  refunded_at timestamp with time zone null,
  plan_active_year character varying(10) null,
  transaction_by character varying(20) null default 'card'::character varying,
  card_details jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_mongo_id_key unique (mongo_id),
  constraint transactions_user_id_fkey foreign KEY (user_id) references user_profile (id) on delete set null,
  constraint transactions_promo_code_id_fkey foreign KEY (promo_code_id) references promo_codes (id) on delete set null,
  constraint transactions_refunded_by_fkey foreign KEY (refunded_by) references user_profile (id) on delete set null,
  constraint transactions_rental_address_id_fkey foreign KEY (rental_address_id) references user_addresses (id) on delete set null,
  constraint transactions_event_id_fkey foreign KEY (event_id) references events (id) on delete set null,
  constraint transactions_plan_id_fkey foreign KEY (plan_id) references plans (id) on delete set null,
  constraint transactions_payment_type_check check (
    (
      (
        (payment_type)::text = any (
          (
            array[
              'subscription'::character varying,
              'withdrawal'::character varying,
              'event_tax'::character varying,
              'rental_address'::character varying
            ]
          )::text[]
        )
      )
      or (payment_type is null)
    )
  ),
  constraint transactions_status_check check (
    (
      (
        (status)::text = any (
          (
            array[
              'pending'::character varying,
              'released'::character varying,
              'approved'::character varying,
              'flagged'::character varying,
              'refunded'::character varying,
              'completed'::character varying,
              'cancelled'::character varying
            ]
          )::text[]
        )
      )
      or (status is null)
    )
  ),
  constraint transactions_plan_type_check check (
    (
      (
        (plan_type)::text = any (
          (
            array[
              'Basic'::character varying,
              'Plus'::character varying,
              'Premium'::character varying,
              'Better'::character varying
            ]
          )::text[]
        )
      )
      or (plan_type is null)
    )
  ),
  constraint transactions_transaction_by_check check (
    (
      (
        (transaction_by)::text = any (
          (
            array[
              'card'::character varying,
              'bank_transfer'::character varying,
              'cash'::character varying,
              'other'::character varying
            ]
          )::text[]
        )
      )
      or (transaction_by is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_transactions_mongo_id on public.transactions using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_transaction_id on public.transactions using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_payment_type on public.transactions using btree (payment_type) TABLESPACE pg_default;

create index IF not exists idx_transactions_plan_id on public.transactions using btree (plan_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_promo_code_id on public.transactions using btree (promo_code_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_event_id on public.transactions using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_rental_address_id on public.transactions using btree (rental_address_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_user_id on public.transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_transactions_refunded_by on public.transactions using btree (refunded_by) TABLESPACE pg_default;

create index IF not exists idx_transactions_status on public.transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_transactions_is_refunded on public.transactions using btree (is_refunded) TABLESPACE pg_default;

create index IF not exists idx_transactions_transaction_date on public.transactions using btree (transaction_date) TABLESPACE pg_default;

create index IF not exists idx_transactions_created_at on public.transactions using btree (created_at) TABLESPACE pg_default;





create table public.user_addresses (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  created_by uuid null,
  address_type character varying(50) null,
  business_name character varying(255) null,
  business_phone_code character varying(10) null,
  business_phone character varying(20) null,
  business_email character varying(255) null,
  business_entity_type character varying(100) null,
  business_nature character varying(255) null,
  is_home_office_deduction boolean null default false,
  tax_filing_status character varying(100) null,
  estimated_income numeric(15, 2) null,
  nickname character varying(255) null,
  street text null,
  description text null,
  apartment character varying(255) null,
  county character varying(255) null,
  city character varying(255) null,
  state character varying(255) null,
  zip character varying(20) null,
  bedrooms integer null,
  country character varying(100) null,
  lat numeric(10, 8) null,
  lng numeric(11, 8) null,
  time_zone character varying(100) null,
  year integer null,
  is_default boolean null default false,
  is_active boolean null default true,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_addresses_pkey primary key (id),
  constraint user_addresses_mongo_id_key unique (mongo_id),
  constraint user_addresses_created_by_fkey foreign KEY (created_by) references user_profile (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_mongo_id on public.user_addresses using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_created_by on public.user_addresses using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_address_type on public.user_addresses using btree (address_type) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_is_default on public.user_addresses using btree (is_default) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_is_active on public.user_addresses using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_is_deleted on public.user_addresses using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_created_at on public.user_addresses using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_user_addresses_location on public.user_addresses using btree (lat, lng) TABLESPACE pg_default;





create table public.user_notification_categories (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category_id character varying(255) null,
  created_at timestamp with time zone null default now(),
  constraint user_notification_categories_pkey primary key (id),
  constraint fk_user_notification_categories_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_notification_categories_user on public.user_notification_categories using btree (user_id) TABLESPACE pg_default;




create table public.user_profile (
  id uuid not null default gen_random_uuid (),
  mongo_id character varying(255) null,
  first_name character varying(255) null,
  last_name character varying(255) null,
  profile_picture_url text null,
  is_select_profile_pic boolean null default false,
  dob_date integer null,
  dob_month integer null,
  dob_year integer null,
  username character varying(255) null,
  email character varying(255) not null,
  phone_code character varying(10) null,
  phone character varying(20) null,
  is_active boolean null default true,
  user_type public.user_role not null,
  token_expired boolean null default false,
  customer_stripe_id character varying(255) null,
  vendor_stripe_id character varying(255) null,
  referral_tier integer null default 1,
  referral_percent numeric(5, 2) null,
  referral_code character varying(255) null,
  referred_by character varying(255) null,
  commission_earnings numeric(15, 2) null default 0,
  commission_percentage_level1 numeric(5, 2) null default 25,
  commission_percentage_level2 numeric(5, 2) null default 2,
  referred_clients_count integer null default 0,
  referred_affiliate_count integer null default 0,
  is_eligible_to_refer_clients boolean null default false,
  is_eligible_to_refer_affiliates boolean null default false,
  referral_sent integer null default 0,
  is_add_card boolean null default false,
  has_bank boolean null default false,
  bank_account_number character varying(255) null,
  bank_routing_number character varying(255) null,
  payment_enabled boolean null default false,
  payout_enabled boolean null default false,
  is_email_verified boolean null default false,
  is_phone_verified boolean null default false,
  last_kyc_submitted timestamp with time zone null,
  otp character varying(10) null,
  otp_send_to character varying(10) null,
  otp_last_generated timestamp with time zone null,
  forgot_password_token character varying(255) null,
  forgot_password_requested_at timestamp with time zone null,
  forgot_password_expires_at timestamp with time zone null,
  device_tokens text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profile_pkey primary key (id),
  constraint user_profile_email_key unique (email),
  constraint user_profile_mongo_id_key unique (mongo_id),
  constraint user_profile_username_key unique (username),
  constraint user_profile_otp_send_to_check check (
    (
      (otp_send_to)::text = any (
        (
          array[
            'Email'::character varying,
            'Phone'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint user_profile_referral_tier_check check ((referral_tier = any (array[1, 2])))
) TABLESPACE pg_default;

create index IF not exists idx_user_profile_mongo_id on public.user_profile using btree (mongo_id) TABLESPACE pg_default;

create index IF not exists idx_user_profile_email on public.user_profile using btree (email) TABLESPACE pg_default;

create index IF not exists idx_user_profile_user_type on public.user_profile using btree (user_type) TABLESPACE pg_default;

create index IF not exists idx_user_profile_referral_code on public.user_profile using btree (referral_code) TABLESPACE pg_default;

create index IF not exists idx_user_profile_referred_by on public.user_profile using btree (referred_by) TABLESPACE pg_default;




create table public.user_questionnaire (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  question text null,
  response text null,
  created_at timestamp with time zone null default now(),
  constraint user_questionnaire_pkey primary key (id),
  constraint fk_user_questionnaire_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_questionnaire_user on public.user_questionnaire using btree (user_id) TABLESPACE pg_default;



create table public.user_referred_affiliates (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  affiliate_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint user_referred_affiliates_pkey primary key (id),
  constraint fk_user_referred_affiliates_affiliate foreign KEY (affiliate_id) references user_profile (id) on delete CASCADE,
  constraint fk_user_referred_affiliates_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_referred_affiliates_user on public.user_referred_affiliates using btree (user_id) TABLESPACE pg_default;



create table public.user_referred_clients (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  client_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint user_referred_clients_pkey primary key (id),
  constraint fk_user_referred_clients_client foreign KEY (client_id) references user_profile (id) on delete CASCADE,
  constraint fk_user_referred_clients_user foreign KEY (user_id) references user_profile (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_referred_clients_user on public.user_referred_clients using btree (user_id) TABLESPACE pg_default;