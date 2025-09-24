import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ProposalDatabase } from "@/@types";
import { reimbursementPlanToHtml } from "@/html-to-pdf/reimbursement-plan";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";
import { DocuSignEmbeddedSigning } from "@/lib/e-sign";
import { env } from "@/env";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

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

    // Check if reimbursement plan already exists
    const { data: existingPlan, error: planError } = await supabase
      .from("proposals")
      .select("*")
      .eq("form_type", "Reimbursement_Plan")
      .eq("created_by", user.id)
      .single();

    if (planError && planError.code !== "PGRST116") {
      console.error("Error checking existing plan:", planError);
      return NextResponse.json(
        { error: "Failed to check existing plan", success: false },
        { status: 500 }
      );
    }

    if (
      existingPlan &&
      existingPlan?.is_signature_done &&
      existingPlan.signature_doc_url
    ) {
      // Return existing plan
      return NextResponse.json({
        success: true,
        data: existingPlan as ProposalDatabase,
      });
    }

    const planData = {
      form_type: "Reimbursement_Plan",
      created_by: user.id,
      is_manual_agreement: false,
      is_signature_done: false,
      is_business_signature_done: false,
      is_mail_sent_to_business: false,
      is_mail_sent_to_user: false,
      signature_doc_url: "",
      created_at: new Date().toISOString(),
    };

    const { data: proposal, error: createError } = await supabase
      .from("proposals")
      .insert(planData)
      .select()
      .single();

    if (createError) {
      console.error("Error creating reimbursement plan:", createError);
      return NextResponse.json(
        { error: "Failed to create reimbursement plan", success: false },
        { status: 500 }
      );
    }

    const html = reimbursementPlanToHtml();

    const result = await pdfService.generatePDF(html, {
      filename: "reimbursement-plan",
      orientation: "portrait",
      paperSize: "A4",
      margins: {
        top: "0.5in",
        right: "0.25in",
        bottom: "0.5in",
        left: "0.25in",
      },
      printBackground: true,
      displayHeaderFooter: false,
      timeout: 30000,
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

    // Update proposal with S3 URL
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ signature_doc_url: s3Result.url })
      .eq("id", proposal.id);

    if (updateError) {
      console.error("Error updating proposal with S3 URL:", updateError);
      return NextResponse.json(
        { error: "Failed to update proposal", success: false },
        { status: 500 }
      );
    }

    // Generate return URL for DocuSign
    const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/subscriber/reimbursement-plan?docu-sign-success=true&proposalId=${proposal.id}`;

    // Create DocuSign embedded signing request
    const docusignRequest = {
      documentBase64: result.buffer.toString("base64"),
      documentName: `Reimbursement_Plan_${proposal.id}`,
      recipientEmail: user.email || "", // You may need to get business email from user profile
      recipientName: user.user_metadata?.full_name || user.email || "User",
      returnUrl,
      emailSubject: "Please sign your Reimbursement Plan",
      emailBlurb: "Please review and sign your Reimbursement Plan document.",
      signerClientUserId: uuidv4(),
    };

    // Initialize DocuSign embedded signing
    const docusignService = new DocuSignEmbeddedSigning();
    const signingResponse =
      await docusignService.sendEnvelopeForEmbeddedSigning(docusignRequest);

    console.log("signingResponse", signingResponse);

    // Update proposal with envelope ID
    const { error: envelopeUpdateError } = await supabase
      .from("proposals")
      .update({
        envelope_id: signingResponse.envelopeId,
        business_recipient_id: docusignRequest.signerClientUserId,
      })
      .eq("id", proposal.id);

    if (envelopeUpdateError) {
      console.error(
        "Error updating proposal with envelope ID:",
        envelopeUpdateError
      );
      return NextResponse.json(
        { error: "Failed to update proposal with envelope ID", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        proposal: {
          ...proposal,
          envelope_id: signingResponse.envelopeId,
          signature_doc_url: s3Result.url,
        },
        docusignData: {
          envelopeId: signingResponse.envelopeId,
          redirectUrl: signingResponse.url,
        },
      },
    });
  } catch (error) {
    console.error(
      "Error in POST /api/subscriber/pdf/reimbursement-plan-form:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
