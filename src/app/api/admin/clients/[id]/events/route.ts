import { adminSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await adminSupabaseServerClient();
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build query - fetch events with all related data
    let query = supabase
      .from("events")
      .select(
        `
        *,
        defendability_scores:defendability_score_id (*),
        event_documents (*),
        daily_amounts (*),
        event_invoices:event_invoice_id (*),
        rental_address:user_addresses!rental_address_id (*),
        business_address:user_addresses!business_address_id (*),
        rental_agreement:proposals!rental_agreement_id (*)
      `
      )
      .eq("is_draft", false)
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (year) {
      query = query.eq("year", parseInt(year));
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: events || [],
    });
  } catch (error) {
    console.error("Error in events API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

