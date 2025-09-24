import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get user profile with subscriber profile data
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select(
        `
        id,
        mongo_id,
        first_name,
        last_name,
        profile_picture_url,
        is_select_profile_pic,
        dob_date,
        dob_month,
        dob_year,
        username,
        phone_code,
        phone,
        is_active,
        user_type,
        token_expired,
        customer_stripe_id,
        vendor_stripe_id,
        referral_tier,
        referral_percent,
        referral_code,
        referred_by,
        commission_earnings,
        commission_percentage_level1,
        commission_percentage_level2,
        referred_clients_count,
        referred_affiliate_count,
        is_eligible_to_refer_clients,
        is_eligible_to_refer_affiliates,
        referral_sent,
        is_add_card,
        has_bank,
        bank_account_number,
        bank_routing_number,
        payment_enabled,
        payout_enabled, 
        last_kyc_submitted,
        otp,
        otp_send_to,
        otp_last_generated,
        forgot_password_token,
        forgot_password_requested_at,
        forgot_password_expires_at,
        device_tokens,
        street,
        apartment,
        city,
        state,
        zip,
        country,
        lat,
        lng,
        time_zone,
        created_at,
        updated_at,
        subscriber_profile (
          id,
          business_name,
          legal_business_name,
          business_website,
          business_phone_code,
          business_phone,
          business_email,
          business_entity_type,
          business_nature,
          years_in_business,
          ssn,
          tax_ein,
          accountant_id,
          referral_balance,
          active_step,
          rental_amount,
          free_event_earned,
          is_update_info,
          request_packet_at,
          request_accepted,
          invited_by_vendor,
          vendor_id,
          subscription_basic_rate,
          plan_id,
          plan_start_date,
          plan_end_date,
          current_plan_active_year,
          is_subscription_active,
          is_free_subscription_active,
          free_trial_start_date,
          free_trial_end_date,
          is_one_time_purchase,
          is_send_one_time_purchase_email,
          is_auto_renew_subscription,
          is_manual_valuation,
          is_trial_allowed,
          last_subscription_reminder,
          is_tax_pro_email_reminder_send,
          is_already_have_reimbursement_plan,
          is_custom_plan,
          accounts_payable_email,
          allow_no_of_rental_address,
          allow_to_create_template,
          allow_to_create_draft,
          is_allowed_personally_vetted,
          is_digital_valuation_allow,
          is_success_call,
          is_schedule_14,
          is_everything_bundle,
          is_add_another_residence,
          is_audit_coverage,
          is_better_bundle,
          event_tax_percentage,
          is_feedback_done,
          created_at,
          updated_at,
          reimbursement_plan_id,
          custom_plan_id
        )
      `
      )
      .eq("id", user.id)
      .eq("user_type", "Subscriber")
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "User profile not found or user is not a subscriber" },
        { status: 404 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if subscriber profile exists
    if (
      !userProfile.subscriber_profile ||
      userProfile.subscriber_profile.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Subscriber profile not found",
          user_profile: userProfile,
          subscriber_profile: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user_profile: userProfile,
        subscriber_profile: userProfile.subscriber_profile[0],
      },
    });
  } catch (error) {
    console.error("Unexpected error in subscriber user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Get user profile ID
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("id")
      .eq("user_id", user.id)
      .eq("user_type", "Subscriber")
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Update user profile
    const { data: updatedUserProfile, error: updateUserError } = await supabase
      .from("user_profile")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        profile_picture_url: body.profile_picture_url,
        is_select_profile_pic: body.is_select_profile_pic,
        dob_date: body.dob_date,
        dob_month: body.dob_month,
        dob_year: body.dob_year,
        username: body.username,
        phone_code: body.phone_code,
        phone: body.phone,
        street: body.street,
        apartment: body.apartment,
        city: body.city,
        state: body.state,
        zip: body.zip,
        country: body.country,
        lat: body.lat,
        lng: body.lng,
        time_zone: body.time_zone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userProfile.id)
      .select()
      .single();

    if (updateUserError) {
      console.error("Error updating user profile:", updateUserError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    // Update subscriber profile if provided
    let updatedSubscriberProfile = null;
    if (body.subscriber_profile) {
      const { data: subscriberData, error: updateSubscriberError } =
        await supabase
          .from("subscriber_profile")
          .update({
            business_name: body.subscriber_profile.business_name,
            legal_business_name: body.subscriber_profile.legal_business_name,
            business_website: body.subscriber_profile.business_website,
            business_phone_code: body.subscriber_profile.business_phone_code,
            business_phone: body.subscriber_profile.business_phone,
            business_email: body.subscriber_profile.business_email,
            business_entity_type: body.subscriber_profile.business_entity_type,
            business_nature: body.subscriber_profile.business_nature,
            years_in_business: body.subscriber_profile.years_in_business,
            ssn: body.subscriber_profile.ssn,
            tax_ein: body.subscriber_profile.tax_ein,
            rental_amount: body.subscriber_profile.rental_amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userProfile.id)
          .select()
          .single();

      if (updateSubscriberError) {
        console.error(
          "Error updating subscriber profile:",
          updateSubscriberError
        );
        return NextResponse.json(
          { error: "Failed to update subscriber profile" },
          { status: 500 }
        );
      }

      updatedSubscriberProfile = subscriberData;
    }

    return NextResponse.json({
      success: true,
      data: {
        user_profile: updatedUserProfile,
        subscriber_profile: updatedSubscriberProfile,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in update subscriber user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
