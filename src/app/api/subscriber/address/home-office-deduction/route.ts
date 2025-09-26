import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "[PUT /api/subscriber/address/home-office-deduction] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { addressId, isHomeOfficeDeduction } = body;

    if (!addressId || typeof isHomeOfficeDeduction !== "boolean") {
      return NextResponse.json(
        { error: "Address ID and home office deduction status are required" },
        { status: 400 }
      );
    }

    // Update the home office deduction status for the specific address
    const { data: updatedAddress, error: updateError } = await supabase
      .from("user_addresses")
      .update({ 
        is_home_office_deduction: isHomeOfficeDeduction,
        updated_at: new Date().toISOString()
      })
      .eq("id", addressId)
      .eq("created_by", user.id)
      .eq("address_type", "rental")
      .eq("is_active", true)
      .eq("is_deleted", false)
      .select()
      .single();

    if (updateError) {
      console.error(
        "[PUT /api/subscriber/address/home-office-deduction] Database error updating home office deduction:",
        {
          error: updateError,
          userId: user.id,
          addressId,
          isHomeOfficeDeduction,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Failed to update home office deduction status" },
        { status: 500 }
      );
    }

    if (!updatedAddress) {
      return NextResponse.json(
        { error: "Address not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedAddress,
      message: "Home office deduction status updated successfully",
    });
  } catch (error) {
    console.error(
      "[PUT /api/subscriber/address/home-office-deduction] Unexpected error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
