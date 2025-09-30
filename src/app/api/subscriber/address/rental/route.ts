import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { differenceInDays } from "date-fns";

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
        "[GET /api/subscriber/address/rental] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(
        "[GET /api/subscriber/address/rental] No user found in session"
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { data: rentalProperties, error: propertiesError } = await supabase
      .from("user_addresses")
      .select(
        `
       *
      `
      )
      .eq("created_by", user.id)
      .eq("address_type", "rental")
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (propertiesError) {
      console.error(
        "[GET /api/subscriber/address/rental] Database error fetching rental properties:",
        {
          error: propertiesError,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to fetch rental properties" },
        { status: 500 }
      );
    }

    if (!rentalProperties || rentalProperties.length === 0) {
      console.warn(
        `[GET /api/subscriber/address/rental] No rental properties found for user: ${user.id}`
      );
    }

    const rentalPropertiesWithEventCount = await Promise.all(
      (rentalProperties || []).map(async (property) => {
        const { error: eventsError, data: events } = await supabase
          .from("events")
          .select("*")
          .eq("is_draft", false)
          .eq("rental_address_id", property.id);

        if (eventsError) {
          console.error(
            `[GET /api/subscriber/address/rental] Error fetching events for property ${property.id}:`,
            {
              error: eventsError,
              propertyId: property.id,
              userId: user.id,
              timestamp: new Date().toISOString(),
            }
          );
          return {
            ...property,
            number_of_days_used: 0,
          };
        }

        const number_of_days_used =
          events
            ?.map((event) => {
              return event.start_date && event.end_date
                ? differenceInDays(
                    new Date(event.end_date),
                    new Date(event.start_date)
                  ) + 1
                : 0;
            })
            .reduce((acc, curr) => acc + curr, 0) || 0;

        return {
          ...property,
          number_of_days_used,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: rentalPropertiesWithEventCount,
      count: rentalPropertiesWithEventCount?.length || 0,
    });
  } catch (error) {
    console.error("[GET /api/subscriber/address/rental] Unexpected error:", {
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
        "[POST /api/subscriber/address/rental] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(
        "[POST /api/subscriber/address/rental] No user found in session"
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
        `[POST /api/subscriber/address/rental] Database error fetching user profile for user ${user.id}:`,
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
        `[POST /api/subscriber/address/rental] No user profile found for user: ${user.id}`
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
        `[POST /api/subscriber/address/rental] JSON parse error for user ${user.id}:`,
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
        `[POST /api/subscriber/address/rental] Missing required fields for user ${user.id}:`,
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

    const rentalPropertyData = {
      created_by: userProfile.id,
      address_type: "rental",
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

    const { data: newProperty, error: insertError } = await supabase
      .from("user_addresses")
      .insert(rentalPropertyData)
      .select()
      .single();

    if (insertError) {
      console.error(
        `[POST /api/subscriber/address/rental] Database error creating rental property for user ${user.id}:`,
        {
          error: insertError,
          userId: user.id,
          propertyData: {
            street: rentalPropertyData.street,
            city: rentalPropertyData.city,
            state: rentalPropertyData.state,
            zip: rentalPropertyData.zip,
          },
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to create rental property" },
        { status: 500 }
      );
    }

    if (!newProperty) {
      console.error(
        `[POST /api/subscriber/address/rental] No property returned after insert for user: ${user.id}`
      );
      return NextResponse.json(
        { error: "Failed to create rental property" },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(
        `[POST /api/subscriber/address/rental] Slow property creation completed in ${duration}ms for user: ${user.id}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newProperty,
        message: "Rental property created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[POST /api/subscriber/address/rental] Unexpected error:", {
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
