import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: auth_error,
    } = await supabase.auth.getUser();

    if (auth_error || !user) {
      console.error(
        "[GET /api/subscriber/address/rental/[id]] Authentication failed:",
        {
          error: auth_error?.message,
          hasUser: !!user,
        }
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    const { data: businessProperty, error: propertyError } = await supabase
      .from("user_addresses")
      .select(`*`)
      .eq("created_by", user.id)
      .eq("address_type", "business")
      .eq("is_default", true)
      .single();

    if (propertyError) {
      console.error(
        "[GET /api/subscriber/address/business/default] Error fetching rental property:",
        {
          userId: user.id,
          error: propertyError.message,
          code: propertyError.code,
          details: propertyError.details,
        }
      );
      return NextResponse.json(
        { error: "Failed to fetch business property" },
        { status: 500 }
      );
    }

    if (!businessProperty) {
      console.warn(
        "[GET /api/subscriber/address/business/default] Business property not found:",
        {
          userId: user.id,
        }
      );
      return NextResponse.json(
        { error: "Business property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: businessProperty,
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
