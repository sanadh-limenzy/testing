import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface EventData {
  id: string;
  rental_address_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  amount: number;
  // Add other event fields as needed
}

interface ApiResponse {
  data?: EventData[];
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user for authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Rental address ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("rental_address_id", id)
      .eq("is_draft", false)
      .eq("created_by", user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/events/rental/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
