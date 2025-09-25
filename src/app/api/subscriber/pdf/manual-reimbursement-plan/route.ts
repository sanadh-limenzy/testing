import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ManualReimbursementPlanRequest {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
}

interface ManualReimbursementPlanResponse {
  success: boolean;
  data?: {
    proposal_id: string;
  };
  error?: string;
  message?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ManualReimbursementPlanResponse>> {
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
    let body: ManualReimbursementPlanRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body", success: false },
        { status: 400 }
      );
    }

    const { file_url, file_name } = body;

    // Validate required fields
    if (!file_url || !file_name) {
      return NextResponse.json(
        {
          error: "Missing required fields: file_url, file_name",
          success: false,
        },
        { status: 400 }
      );
    }

    // Find the user's reimbursement plan proposal (there should only be one)
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(`
        id, 
        event_id,
        form_type
      `)
      .eq("created_by", user.id)
      .eq("form_type", "Reimbursement_Plan")
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: "Reimbursement plan not found or access denied", success: false },
        { status: 404 }
      );
    }

    // Update the proposal with manual agreement
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        signature_doc_url: file_url,
        is_manual_agreement: true,
        updated_at: new Date().toISOString(),
        is_signature_done: true,
        is_business_signature_done: true,
      })
      .eq("id", proposal.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error updating reimbursement plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update reimbursement plan", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        proposal_id: updatedProposal.id,
      },
      message: "Manual reimbursement plan updated successfully",
    });
  } catch (error) {
    console.error("Error in manual reimbursement plan upload:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
