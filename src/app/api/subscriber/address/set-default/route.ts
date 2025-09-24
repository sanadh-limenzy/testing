import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
        "[POST /api/subscriber/address/set-default] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!user) {
      console.warn(
        "[POST /api/subscriber/address/set-default] No user found in session"
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(
        `[POST /api/subscriber/address/set-default] JSON parse error for user ${user.id}:`,
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

    const { addressId, addressType = "rental" } = body;

    if (!addressId) {
      console.warn(
        `[POST /api/subscriber/address/set-default] Missing addressId for user ${user.id}`
      );
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Validate address type
    if (!["rental", "business"].includes(addressType)) {
      console.warn(
        `[POST /api/subscriber/address/set-default] Invalid addressType for user ${user.id}: ${addressType}`
      );
      return NextResponse.json(
        { error: "Invalid address type. Must be 'rental' or 'business'" },
        { status: 400 }
      );
    }

    // Verify the address belongs to the user
    const { data: address, error: addressError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("created_by", user.id)
      .eq("address_type", addressType)
      .single();

    if (addressError) {
      console.error(
        `[POST /api/subscriber/address/set-default] Database error fetching address for user ${user.id}:`,
        {
          error: addressError,
          userId: user.id,
          addressId,
          addressType,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Address not found or access denied" },
        { status: 404 }
      );
    }

    if (!address) {
      console.warn(
        `[POST /api/subscriber/address/set-default] Address not found for user: ${user.id}, addressId: ${addressId}, addressType: ${addressType}`
      );
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Start a transaction to update all addresses and set the new default
    const { error: updateAllError } = await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("created_by", user.id)
      .eq("address_type", addressType);

    if (updateAllError) {
      console.error(
        `[POST /api/subscriber/address/set-default] Database error clearing default flags for user ${user.id}:`,
        {
          error: updateAllError,
          userId: user.id,
          addressType,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to update addresses" },
        { status: 500 }
      );
    }

    // Set the new default address
    const { error: setDefaultError } = await supabase
      .from("user_addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("created_by", user.id);

    if (setDefaultError) {
      console.error(
        `[POST /api/subscriber/address/set-default] Database error setting default address for user ${user.id}:`,
        {
          error: setDefaultError,
          userId: user.id,
          addressId,
          addressType,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to set default address" },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(
        `[POST /api/subscriber/address/set-default] Slow operation completed in ${duration}ms for user: ${user.id}`
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Default address updated successfully",
        data: { addressId, addressType, isDefault: true },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      "[POST /api/subscriber/address/set-default] Unexpected error:",
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString(),
      }
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
