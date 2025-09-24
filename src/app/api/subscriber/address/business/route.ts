import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error(
        "[GET /api/subscriber/address/business] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(
        "[GET /api/subscriber/address/business] No user found in session"
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { data: businessAddresses, error: addressesError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("created_by", user.id)
      .eq("address_type", "business")
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (addressesError) {
      console.error(
        "[GET /api/subscriber/address/business] Database error fetching business addresses:",
        {
          error: addressesError,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to fetch business addresses" },
        { status: 500 }
      );
    }

    if (!businessAddresses || businessAddresses.length === 0) {
      console.warn(
        `[GET /api/subscriber/address/business] No business addresses found for user: ${user.id}`
      );
    }

    return NextResponse.json({
      success: true,
      data: businessAddresses || [],
      count: businessAddresses?.length || 0,
    });
  } catch (error) {
    console.error("[GET /api/subscriber/address/business] Unexpected error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error(
        "[POST /api/subscriber/address/business] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(
        "[POST /api/subscriber/address/business] No user found in session"
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error(
        `[POST /api/subscriber/address/business] Database error fetching user profile for user ${user.id}:`,
        {
          error: profileError,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!userProfile) {
      console.warn(
        `[POST /api/subscriber/address/business] No user profile found for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(
        `[POST /api/subscriber/address/business] JSON parse error for user ${user.id}:`,
        {
          error: parseError instanceof Error ? parseError.message : parseError,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const requiredFields = ["street", "city", "state", "zip", "country"];
    const missingFields = [];
    for (const field of requiredFields) {
      if (!body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.warn(
        `[POST /api/subscriber/address/business] Missing required fields for user ${user.id}:`,
        {
          missingFields,
          providedFields: Object.keys(body),
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const businessAddressData = {
      created_by: userProfile.id,
      address_type: "business",
      business_name: body.business_name || null,
      business_phone_code: body.business_phone_code || null,
      business_phone: body.business_phone || null,
      business_email: body.business_email || null,
      business_entity_type: body.business_entity_type || null,
      business_nature: body.business_nature || null,
      is_home_office_deduction: body.is_home_office_deduction || false,
      tax_filing_status: body.tax_filing_status || null,
      estimated_income: body.estimated_income || null,
      nickname: body.nickname || null,
      street: body.street,
      description: body.description || null,
      apartment: body.apartment || null,
      county: body.county || null,
      city: body.city,
      state: body.state,
      zip: body.zip,
      bedrooms: body.bedrooms || null,
      country: body.country,
      lat: body.lat || null,
      lng: body.lng || null,
      time_zone: body.time_zone || null,
      year: body.year || null,
      is_default: body.is_default || false,
      is_active: true,
      is_deleted: false,
    };

    const { data: newAddress, error: insertError } = await supabase
      .from("user_addresses")
      .insert(businessAddressData)
      .select()
      .single();

    if (insertError) {
      console.error(
        `[POST /api/subscriber/address/business] Database error creating business address for user ${user.id}:`,
        {
          error: insertError,
          userId: user.id,
          addressData: {
            street: businessAddressData.street,
            city: businessAddressData.city,
            state: businessAddressData.state,
            zip: businessAddressData.zip,
          },
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to create business address" },
        { status: 500 }
      );
    }

    if (!newAddress) {
      console.error(
        `[POST /api/subscriber/address/business] No address returned after insert for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "Failed to create business address" },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(
        `[POST /api/subscriber/address/business] Slow address creation completed in ${duration}ms for user: ${user.id}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newAddress,
        message: "Business address created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[POST /api/subscriber/address/business] Unexpected error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
