import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper function to validate email addresses
function validateEmails(emails: string[]): { isValid: boolean; invalidEmails: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((email) => !emailRegex.test(email));
  return {
    isValid: invalidEmails.length === 0,
    invalidEmails,
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if promo code exists
    const { data: existingPromoCode, error: fetchError } = await supabase
      .from("promo_codes")
      .select("id, used_by_count")
      .eq("id", id)
      .eq("is_delete", false)
      .single();

    if (fetchError || !existingPromoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Soft delete promo code by setting is_delete to true
    // The junction tables will be handled by CASCADE constraints
    const { error: deleteError } = await supabase
      .from("promo_codes")
      .update({ is_delete: true })
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting promo code:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete promo code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete promo code API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      code,
      promo_type,
      is_flat_discount,
      discount_amount,
      discount_percent,
      start_at,
      expire_at,
      no_of_promo_allow_to_used,
      is_one_time_user,
      is_unlimited_promo,
      promo_for,
    } = body;

    // Validate required fields
    if (!name || !code || !start_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email addresses if provided
    if (promo_for && promo_for.length > 0) {
      const { isValid, invalidEmails } = validateEmails(promo_for);
      
      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate discount fields
    if (is_flat_discount && !discount_amount) {
      return NextResponse.json(
        { error: "Discount amount is required for flat discount" },
        { status: 400 }
      );
    }

    if (!is_flat_discount && !discount_percent) {
      return NextResponse.json(
        { error: "Discount percent is required for percentage discount" },
        { status: 400 }
      );
    }

    // Check if code already exists (excluding current promo code, case-insensitive)
    const { data: existingCode } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code.toLowerCase())
      .neq("id", id)
      .eq("is_delete", false)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }

    // Update promo code (store code in lowercase)
    const { data: updatedPromoCode, error: updateError } = await supabase
      .from("promo_codes")
      .update({
        name,
        code: code.toLowerCase(), // Store in lowercase
        promo_type,
        is_flat_discount,
        discount_amount,
        discount_percent,
        start_at,
        expire_at,
        no_of_promo_allow_to_used,
        is_one_time_user,
        is_unlimited_promo,
      })
      .eq("id", id)
      .eq("is_delete", false)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating promo code:", updateError);
      return NextResponse.json(
        { error: "Failed to update promo code" },
        { status: 500 }
      );
    }

    if (!updatedPromoCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    // Update allowed plans relationships
    if (promo_for !== undefined) {
      // Delete existing relationships
      const { error: deleteError } = await supabase
        .from("promo_code_allowed_plans")
        .delete()
        .eq("promo_code_id", id);

      if (deleteError) {
        console.error("Error deleting existing allowed plans:", deleteError);
      }

      // Create new relationships
      if (promo_for.length > 0) {
        const allowedPlansData = promo_for.map((planId: string) => ({
          promo_code_id: id,
          plan_id: planId,
        }));

        const { error: allowedPlansError } = await supabase
          .from("promo_code_allowed_plans")
          .insert(allowedPlansData);

        if (allowedPlansError) {
          console.error("Error creating allowed plans:", allowedPlansError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPromoCode,
    });
  } catch (error) {
    console.error("Error in update promo code API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
