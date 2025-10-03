import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== 'Admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the specific client
    const { data: clientData, error: clientError } = await supabase
      .from('user_profile')
      .select(`
        *,
        subscriber_profile (
          business_name,
          legal_business_name,
          plan_id,
          plan_start_date,
          plan_end_date,
          is_subscription_active,
          is_free_subscription_active,
          accountant_id,
          plans!fk_subscriber_profile_plan (
            id,
            plan_type,
            title,
            description
          ),
          accountant_profile (
            user_profile (
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .eq('id', id)
      .eq('user_type', 'Subscriber')
      .single();

    if (clientError || !clientData) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Transform the data
    const subscriberProfile = clientData.subscriber_profile?.[0];
    const plan = subscriberProfile?.plans;
    const accountantProfile = subscriberProfile?.accountant_profile?.[0];
    
    const addedOn = new Date(clientData.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let currentPlan = "No Plan";
    if (plan) {
      if (plan.plan_type === 'Premium') {
        currentPlan = "Premium (Done For You)";
      } else if (plan.plan_type === 'Plus') {
        currentPlan = "Plus (Done With You)";
      } else if (plan.plan_type === 'Basic') {
        currentPlan = "Basic (Self-Service)";
      } else {
        currentPlan = plan.title || plan.plan_type;
      }
    }

    const planStatus = subscriberProfile?.is_subscription_active || subscriberProfile?.is_free_subscription_active 
      ? "active" 
      : "inactive";

    // Get tax pro name
    let taxPro = "N/A";
    if (accountantProfile?.user_profile) {
      const { first_name, last_name, email } = accountantProfile.user_profile;
      if (first_name && last_name) {
        taxPro = `${first_name} ${last_name}`;
      } else {
        taxPro = email || "N/A";
      }
    }

    const transformedClient = {
      id: clientData.id,
      firstName: clientData.first_name || '',
      lastName: clientData.last_name || '',
      email: clientData.email,
      phone: clientData.phone || '',
      phoneCode: clientData.phone_code || '+1',
      addedOn,
      currentPlan,
      planStatus,
      referredBy: clientData.referred_by || '--',
      status: clientData.is_active ? 'active' : 'inactive',
      businessName: subscriberProfile?.business_name || subscriberProfile?.legal_business_name,
      userType: clientData.user_type,
      isActive: clientData.is_active,
      isSubscriptionActive: subscriberProfile?.is_subscription_active || false,
      planStartDate: subscriberProfile?.plan_start_date,
      planEndDate: subscriberProfile?.plan_end_date,
      taxPro,
    };

    return NextResponse.json({
      success: true,
      data: transformedClient,
    });

  } catch (error) {
    console.error("Error in client details API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
