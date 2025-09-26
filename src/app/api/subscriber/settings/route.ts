import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RentalAddress } from "@/@types/subscriber";
import {
  ProposalDatabase,
  EventTemplateDatabase,
  UserNotificationSettings,
  PlanDatabase,
} from "@/@types";

export const dynamic = "force-dynamic";

interface SettingsData {
  rentalAddresses: RentalAddress[];
  reimbursementPlan: ProposalDatabase | null;
  alreadyHaveReimbursementPlan: boolean;
  eventTemplates: EventTemplateDatabase[];
  notificationSettings: UserNotificationSettings | null;
  plans: PlanDatabase[];
  currentPlan: string | null;
  isAutoRenewSubscription: boolean;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "[GET /api/subscriber/settings] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user profile with subscriber profile
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select(
        `
        *,
        subscriber_profile (
          is_already_have_reimbursement_plan,
          reimbursement_plan: reimbursement_plan_id (*),
          plan_id,
          is_auto_renew_subscription
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "[GET /api/subscriber/settings] Error fetching user profile:",
        profileError
      );
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Fetch rental addresses
    const { data: rentalAddresses, error: rentalError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("created_by", user.id)
      .eq("address_type", "rental")
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (rentalError) {
      console.error(
        "[GET /api/subscriber/settings] Error fetching rental addresses:",
        rentalError
      );
      return NextResponse.json(
        { error: "Failed to fetch rental addresses" },
        { status: 500 }
      );
    }

    // Fetch event templates
    const { data: eventTemplates, error: templatesError } = await supabase
      .from("event_templates")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error(
        "[GET /api/subscriber/settings] Error fetching event templates:",
        templatesError
      );
      return NextResponse.json(
        { error: "Failed to fetch event templates" },
        { status: 500 }
      );
    }

    // Fetch reimbursement plan if it exists
    let reimbursementPlan: ProposalDatabase | null = null;
    if (userProfile.subscriber_profile?.reimbursement_plan) {
      const { data: planData, error: planError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", userProfile.subscriber_profile.reimbursement_plan)
        .eq("created_by", user.id)
        .eq("form_type", "Reimbursement_Plan")
        .single();

      if (!planError && planData) {
        reimbursementPlan = planData;
      }
    }

    // Fetch notification settings
    const { data: notificationSettings, error: notificationError } =
      await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (notificationError && notificationError.code !== "PGRST116") {
      console.error(
        "[GET /api/subscriber/settings] Error fetching notification settings:",
        notificationError
      );
    }

    // Fetch plans
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (plansError) {
      console.error(
        "[GET /api/subscriber/settings] Error fetching plans:",
        plansError
      );
    }

    const settingsData: SettingsData = {
      rentalAddresses: rentalAddresses || [],
      reimbursementPlan,
      alreadyHaveReimbursementPlan:
        userProfile.subscriber_profile?.is_already_have_reimbursement_plan ||
        false,
      eventTemplates: eventTemplates || [],
      notificationSettings: notificationSettings || null,
      plans: plans || [],
      currentPlan: userProfile.subscriber_profile?.plan_id || null,
      isAutoRenewSubscription: userProfile.subscriber_profile?.is_auto_renew_subscription || false,
    };

    return NextResponse.json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error("[GET /api/subscriber/settings] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
