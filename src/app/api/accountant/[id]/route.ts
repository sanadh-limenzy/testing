import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: accountantId } = await params;

  try {
    const supabase = await createServerSupabaseClient();

    if (!accountantId) {
      return NextResponse.json(
        { error: "Accountant ID is required" },
        { status: 400 }
      );
    }

    // Fetch accountant profile by ID
    const { data: accountantProfile, error: accountantError } = await supabase
      .from("accountant_profile")
      .select("*")
      .eq("id", accountantId)
      .single();

    if (accountantError) {
      console.error(
        `[GET /api/accountant/${accountantId}] Database error fetching accountant profile:`,
        {
          error: accountantError,
          accountantId,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "Accountant profile not found" },
        { status: 404 }
      );
    }

    if (!accountantProfile) {
      console.warn(
        `[GET /api/accountant/${accountantId}] No accountant profile found for ID: ${accountantId}`
      );
      return NextResponse.json(
        { error: "Accountant profile not found" },
        { status: 404 }
      );
    }

    // Fetch associated user profile
    const { data: userProfile, error: userError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("id", accountantProfile.user_id)
      .single();

    if (userError) {
      console.error(
        `[GET /api/accountant/${accountantId}] Database error fetching user profile:`,
        {
          error: userError,
          accountantId,
          userId: accountantProfile.user_id,
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(
        `[GET /api/accountant/${accountantId}] Slow operation completed in ${duration}ms`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        accountantProfile,
        userProfile,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[GET /api/accountant/${accountantId}] Unexpected error:`, {
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
