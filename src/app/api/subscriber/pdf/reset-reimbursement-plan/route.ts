import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

interface ResetReimbursementPlanResponse {
  success: boolean;
  data?: {
    proposal_id: string;
  };
  error?: string;
  message?: string;
}

export async function POST(): Promise<
  NextResponse<ResetReimbursementPlanResponse>
> {
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

    // Find the user's reimbursement plan proposal (there should only be one)
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(
        `
        id, 
        event_id,
        form_type
      `
      )
      .eq("created_by", user.id)
      .eq("form_type", "Reimbursement_Plan")
      .limit(1)
      .single();

    if (proposalError || !proposal) {
      console.log(
        "Reimbursement plan not found or access denied",
        proposalError,
        proposal
      );
      return NextResponse.json(
        {
          error: "Reimbursement plan not found or access denied",
          success: false,
        },
        { status: 404 }
      );
    }

    // Reset the proposal to system generated
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        signature_doc_url: null,
        is_manual_agreement: null,
        updated_at: new Date().toISOString(),
        is_signature_done: false,
        is_business_signature_done: false,
      })
      .eq("id", proposal.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error resetting reimbursement plan:", updateError);
      return NextResponse.json(
        { error: "Failed to reset reimbursement plan", success: false },
        { status: 500 }
      );
    }

    revalidateTag("reimbursement-plan-page");

    return NextResponse.json({
      success: true,
      data: {
        proposal_id: updatedProposal.id,
      },
      message: "Reimbursement plan reset to system generated successfully",
    });
  } catch (error) {
    console.error("Error in reset reimbursement plan:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
