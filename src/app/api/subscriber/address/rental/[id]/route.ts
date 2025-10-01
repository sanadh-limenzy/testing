import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "[GET /api/subscriber/address/rental/[id]] Authentication failed:",
        {
          error: authError?.message,
          hasUser: !!user,
        }
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      console.warn(
        "[GET /api/subscriber/address/rental/[id]] Missing property ID"
      );
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    const { data: rentalProperty, error: propertyError } = await supabase
      .from("user_addresses")
      .select(`*`)
      .eq("id", id)
      .eq("created_by", user.id)
      .eq("address_type", "rental")
      .single();

    if (propertyError) {
      console.error(
        "[GET /api/subscriber/address/rental/[id]] Error fetching rental property:",
        {
          propertyId: id,
          userId: user.id,
          error: propertyError.message,
          code: propertyError.code,
          details: propertyError.details,
        }
      );
      return NextResponse.json(
        { error: "Failed to fetch rental property" },
        { status: 500 }
      );
    }

    if (!rentalProperty) {
      console.warn(
        "[GET /api/subscriber/address/rental/[id]] Rental property not found:",
        {
          propertyId: id,
          userId: user.id,
        }
      );
      return NextResponse.json(
        { error: "Rental property not found" },
        { status: 404 }
      );
    }

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("is_draft", false)
      .eq("rental_address_id", rentalProperty.id);

    if (eventsError) {
      console.error(
        "[GET /api/subscriber/address/rental/[id]] Error fetching events:",
        {
          propertyId: rentalProperty.id,
          error: eventsError.message,
          code: eventsError.code,
          details: eventsError.details,
        }
      );
    }

    const { data: residence, error: residencesError } = await supabase
      .from("residences")
      .select("*")
      .eq("address_id", rentalProperty?.mongo_id)
      .single();
    if (residencesError) {
      console.error(
        "[GET /api/subscriber/address/rental/[id]] Error fetching residence:",
        {
          propertyId: rentalProperty.id,
          error: residencesError.message,
          code: residencesError.code,
          details: residencesError.details,
        }
      );
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

    const rentalPropertyWithEventCount = {
      ...rentalProperty,
      number_of_days_used,
      is_custom_plan: residence?.custom_plan_id ? true : false,
      avarage_value: residence?.average_value,
    };

    return NextResponse.json({
      success: true,
      data: rentalPropertyWithEventCount,
    });
  } catch (error) {
    console.error(
      "[GET /api/subscriber/address/rental/[id]] Unexpected error:",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${Date.now() - startTime}ms`,
      }
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
