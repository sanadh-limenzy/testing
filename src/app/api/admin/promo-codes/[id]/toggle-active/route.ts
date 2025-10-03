import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
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
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    // Update promo code status
    const { data: updatedPromoCode, error: updateError } = await supabase
      .from("promo_codes")
      .update({ is_active })
      .eq("id", id)
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

    return NextResponse.json({
      success: true,
      data: updatedPromoCode,
    });
  } catch (error) {
    console.error("Error in toggle promo code active API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
