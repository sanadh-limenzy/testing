import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 }
      );
    }

    // Check if code already exists (case-insensitive - compare with lowercase)
    const { data: existingCode, error: checkError } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code.toLowerCase())
      .eq("is_delete", false)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("Error checking code existence:", checkError);
      return NextResponse.json(
        { error: "Failed to check code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!existingCode,
    });
  } catch (error) {
    console.error("Error in check code API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
