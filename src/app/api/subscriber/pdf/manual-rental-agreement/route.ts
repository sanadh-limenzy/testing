import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ManualRentalAgreementRequest {
  event_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
}

interface ManualRentalAgreementResponse {
  success: boolean;
  data?: {
    proposal_id: string;
    event_id: string;
  };
  error?: string;
  message?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ManualRentalAgreementResponse>> {
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

    // Parse request body
    let body: ManualRentalAgreementRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body", success: false },
        { status: 400 }
      );
    }

    const { event_id, file_url, file_name } = body;

    // Validate required fields
    if (!event_id || !file_url || !file_name) {
      return NextResponse.json(
        {
          error: "Missing required fields: event_id, file_url, file_name",
          success: false,
        },
        { status: 400 }
      );
    }

    // Verify the event exists and belongs to the user
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, title")
      .eq("id", event_id)
      .eq("created_by", user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found or access denied", success: false },
        { status: 404 }
      );
    }

    // Check if there's already a rental agreement for this event
    const { data: existingProposal, error: existingError } = await supabase
      .from("proposals")
      .select("id, form_type")
      .eq("event_id", event_id)
      .eq("form_type", "Rental_Agreement")
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if no proposal exists
      console.error(
        "Error checking for existing rental agreement:",
        existingError
      );
      return NextResponse.json(
        {
          error: "Failed to check for existing rental agreement",
          success: false,
        },
        { status: 500 }
      );
    }

    if (existingProposal) {
      // Update existing proposal with manual agreement
      const { data: updatedProposal, error: updateError } = await supabase
        .from("proposals")
        .update({
          signature_doc_url: file_url,
          is_manual_agreement: true,
          updated_at: new Date().toISOString(),
          is_signature_done: true,
          is_business_signature_done: true,
        })
        .eq("id", existingProposal.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating existing rental agreement:", updateError);
        return NextResponse.json(
          { error: "Failed to update rental agreement", success: false },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          proposal_id: updatedProposal.id,
          event_id: event_id,
        },
        message: "Manual rental agreement updated successfully",
      });
    } else {
      // Create new proposal with manual agreement
      const { data: newProposal, error: createError } = await supabase
        .from("proposals")
        .insert({
          event_id: event_id,
          form_type: "Rental_Agreement",
          signature_doc_url: file_url,
          is_manual_agreement: true,
          is_signature_done: true,
          is_business_signature_done: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating manual rental agreement:", createError);
        return NextResponse.json(
          { error: "Failed to create rental agreement", success: false },
          { status: 500 }
        );
      }

      // Update the event to reference the new proposal
      const { error: updateEventError } = await supabase
        .from("events")
        .update({ rental_agreement_id: newProposal.id })
        .eq("id", event_id)
        .eq("created_by", user.id);

      if (updateEventError) {
        console.error(
          "Error updating event with rental agreement ID:",
          updateEventError
        );
        // Don't fail the entire request for this
      }

      return NextResponse.json({
        success: true,
        data: {
          proposal_id: newProposal.id,
          event_id: event_id,
        },
        message: "Manual rental agreement created successfully",
      });
    }
  } catch (error) {
    console.error("Error in manual rental agreement upload:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
