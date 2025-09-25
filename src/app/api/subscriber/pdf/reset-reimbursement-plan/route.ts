import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { reimbursementPlanToHtml } from "@/html-to-pdf/reimbursement-plan";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";

export const dynamic = "force-dynamic";

interface ResetReimbursementPlanResponse {
  success: boolean;
  data?: {
    proposal_id: string;
    signature_doc_url?: string;
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

    const html = reimbursementPlanToHtml();

    const result = await pdfService.generatePDF(html, {
      filename: "reimbursement-plan",
    });

    // Upload PDF to S3
    const s3Result = await uploadFileToS3(
      result.buffer,
      "reimbursement-plans",
      user.id,
      {
        filename: "reimbursement-plan",
        contentType: "application/pdf",
      }
    );

    if (!s3Result.success) {
      return NextResponse.json(
        { error: "Failed to upload reimbursement plan", success: false },
        { status: 500 }
      );
    }
    // Reset the proposal to system generated
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        signature_doc_url: s3Result.url,
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
    revalidatePath("/subscriber/reimbursement-plan");

    return NextResponse.json({
      success: true,
      data: {
        proposal_id: updatedProposal.id,
        signature_doc_url: s3Result.url,
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
