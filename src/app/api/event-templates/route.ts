import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { EventTemplateDatabase } from "@/@types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated", success: false },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate  required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required", success: false },
        { status: 400 }
      );
    }

    // Create the template data
    const templateData = {
      mongo_id: body.mongo_id || `template_${Date.now()}`,
      created_by: user.id,
      draft_name: body.title,
      title: body.title,
      is_used_as_template: true,
      description: body.description,
      people_count: body.people_count || 0,
      people_names: body.people_names || [],
      excluded_areas: body.excluded_areas || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      amount: null,
      is_manual_valuation: body.is_manual_valuation || false,
      add_to_my_calendar: body.add_to_my_calendar || false,
    };

    const { data: eventTemplate, error } = await supabase
      .from("event_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Error creating event template:", error);
      return NextResponse.json(
        { error: "Failed to create event template", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: eventTemplate,
    });
  } catch (error) {
    console.error("Error in POST /api/event-templates:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated", success: false },
        { status: 401 }
      );
    }

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url);
    const isTemplate = searchParams.get("is_template");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build query - fetch event templates for the authenticated user
    let query = supabase
      .from("event_templates")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (isTemplate !== null && isTemplate !== undefined) {
      query = query.eq("is_used_as_template", isTemplate === "true");
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: eventTemplates, error } = await query;

    if (error) {
      console.error("Error fetching event templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch event templates", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (eventTemplates || []) as EventTemplateDatabase[],
    });
  } catch (error) {
    console.error("Error in GET /api/event-templates:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
