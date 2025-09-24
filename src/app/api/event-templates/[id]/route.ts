import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { EventTemplateDatabase } from "@/@types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required", success: false },
        { status: 400 }
      );
    }

    // Fetch the template
    const { data: template, error } = await supabase
      .from("event_templates")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found or access denied", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template as EventTemplateDatabase,
    });
  } catch (error) {
    console.error("Error in GET /api/event-templates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required", success: false },
        { status: 400 }
      );
    }

    // First, check if the template exists and belongs to the user
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("event_templates")
      .select("id, created_by")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template not found or access denied", success: false },
        { status: 404 }
      );
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from("event_templates")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (deleteError) {
      console.error("Error deleting event template:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete event template", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/event-templates/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
