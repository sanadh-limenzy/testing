import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.user_type !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const clientId = (await params).id;

    // Fetch client data with related information
    const { data: client, error: clientError } = await supabase
      .from("user_profile")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        phone_code,
        created_at,
        user_type,
        is_active,
        referred_by
      `)
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get subscriber profile data if user is a subscriber
    const { data: subscriberProfile, error: subError } = await supabase
      .from("subscriber_profile")
      .select(`
        business_name,
        plan_start_date,
        plan_end_date,
        is_subscription_active,
        plan_id
      `)
      .eq("user_id", clientId)
      .single();

    if (subError) {
      console.error("Error fetching subscriber profile:", subError);
    }

    // Format the response
    const formattedClient = {
      id: client.id,
      firstName: client.first_name || "",
      lastName: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      phoneCode: client.phone_code || "",
      addedOn: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : "",
      currentPlan: "Basic", // Will be updated when we have proper plan data
      planStatus: subscriberProfile?.is_subscription_active ? "active" : "inactive",
      referredBy: client.referred_by || "",
      status: client.is_active ? "active" : "inactive",
      businessName: subscriberProfile?.business_name,
      userType: client.user_type as "Admin" | "Subscriber" | "Accountant" | "Vendor",
      isActive: client.is_active,
      isSubscriptionActive: subscriberProfile?.is_subscription_active || false,
      planStartDate: subscriberProfile?.plan_start_date,
      planEndDate: subscriberProfile?.plan_end_date,
      taxPro: null // This field doesn't exist in the schema, will need to be added if needed
    };

    return NextResponse.json({
      success: true,
      data: formattedClient
    });

  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
