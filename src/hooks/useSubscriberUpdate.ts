import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface UpdateSubscriberData {
  // User Profile fields
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_code?: string;
  phone?: string;

  // Subscriber Profile fields
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
  rental_amount?: number;
  is_auto_renew_subscription?: boolean;
  is_already_have_reimbursement_plan?: boolean;
  is_manual_valuation?: boolean;
  is_trial_allowed?: boolean;
  event_tax_percentage?: number;

  // Address fields
  addresses?: {
    id?: string;
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
  }[];

  // Notification settings
  notification_settings?: {
    pre_event_email_notifications?: boolean;
    during_event_email_notifications?: boolean;
    post_event_email_notifications?: boolean;
    high_upcoming_rental_event_price?: boolean;
    using_the_app_tax_pro?: boolean;
    tax_code_questions?: boolean;
    annual_filing?: boolean;
    best_practices_posts?: boolean;
    money_savings_posts?: boolean;
    tax_law_posts?: boolean;
    time_savings_posts?: boolean;
  };
}

export function useSubscriberUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriberData) => {
      const response = await fetch("/api/subscriber/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update subscriber data");
      }

      return true;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["subscriber-user"] });
      await queryClient.cancelQueries({ queryKey: ["user-data"] });
      await queryClient.cancelQueries({ queryKey: ["settings"] });

      toast.loading("Updating subscriber data...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriber-user"] });
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });

      toast.dismiss();
      toast.success("Subscriber data updated successfully");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update subscriber data"
      );
    },
  });
}
