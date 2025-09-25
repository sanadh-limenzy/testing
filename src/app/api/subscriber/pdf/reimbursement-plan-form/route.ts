import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ProposalDatabase } from "@/@types";
import { reimbursementPlanToHtml } from "@/html-to-pdf/reimbursement-plan";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";
import { revalidateTag } from "next/cache";
// import { DocuSignEmbeddedSigning } from "@/lib/e-sign";
// import { env } from "@/env";
// import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const business_address_id = searchParams.get("business_address_id");

    let businessAddress = null;

    const { data: businessAddressData, error: businessAddressError } =
      await supabase
        .from("user_addresses")
        .select("*")
        .eq("id", business_address_id)
        .single();

    if (businessAddressError) {
      console.error("Error fetching business address:", businessAddressError);
    } else {
      businessAddress = businessAddressData;
    }

    if (!businessAddress) {
      const { data: businessAddressData, error: businessAddressError } =
        await supabase
          .from("user_addresses")
          .select("*")
          .eq("created_by", user.id)
          .eq("address_type", "business")
          .eq("is_default", true)
          .single();

      if (businessAddressError) {
        return NextResponse.json(
          { error: "Failed to fetch business address", success: false },
          { status: 500 }
        );
      } else {
        businessAddress = businessAddressData;
      }
    }

    // Check if reimbursement plan already exists
    const { data: existingPlan, error: planError } = await supabase
      .from("proposals")
      .select("*")
      .eq("form_type", "Reimbursement_Plan")
      .eq("created_by", user.id)
      .limit(1)
      .single();

    if (planError && planError.code !== "PGRST116") {
      console.error("Error checking existing plan:", planError);
      return NextResponse.json(
        { error: "Failed to check existing plan", success: false },
        { status: 500 }
      );
    }

    if (existingPlan && existingPlan.signature_doc_url) {
      // Return existing plan only if it has a signature_doc_url
      return NextResponse.json({
        success: true,
        data: existingPlan as ProposalDatabase,
      });
    }

    // If no existing plan or existing plan has no signature_doc_url, create/update one
    let proposal;
    
    if (existingPlan) {
      // Update existing plan (reset case)
      const { data: updatedProposal, error: updateError } = await supabase
        .from("proposals")
        .update({
          is_manual_agreement: false,
          is_signature_done: false,
          is_business_signature_done: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPlan.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating existing reimbursement plan:", updateError);
        return NextResponse.json(
          { error: "Failed to update reimbursement plan", success: false },
          { status: 500 }
        );
      }
      proposal = updatedProposal;
    } else {
      // Create new plan
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
        business_address_id: businessAddress?.id,
        year: new Date().getFullYear(),
      };

      const { data: newProposal, error: createError } = await supabase
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
      proposal = newProposal;
    }

    const html = reimbursementPlanToHtml();

    const result = await pdfService.generatePDF(html, {
      filename: "reimbursement-plan",
      orientation: "portrait",
      paperSize: "a4",
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

    const { error: userDataError } = await supabase
      .from("subscriber_profile")
      .update({
        reimbursement_plan_id: proposal.id,
      })
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (userDataError) {
      console.error("Error updating subscriber profile:", userDataError);
      return NextResponse.json(
        { error: "Failed to update subscriber profile" },
        { status: 500 }
      );
    }

    // Generate return URL for DocuSign
    // const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/subscriber/reimbursement-plan?docu-sign-success=true&proposalId=${proposal.id}`;

    // Create DocuSign embedded signing request
    // const docusignRequest = {
    //   documentBase64: result.buffer.toString("base64"),
    //   documentName: `Reimbursement_Plan_${proposal.id}`,
    //   recipientEmail: user.email || "", // You may need to get business email from user profile
    //   recipientName: user.user_metadata?.full_name || user.email || "User",
    //   returnUrl,
    //   emailSubject: "Please sign your Reimbursement Plan",
    //   emailBlurb: "Please review and sign your Reimbursement Plan document.",
    //   signerClientUserId: uuidv4(),
    // };

    // // Initialize DocuSign embedded signing
    // const docusignService = new DocuSignEmbeddedSigning();
    // const signingResponse =
    //   await docusignService.sendEnvelopeForEmbeddedSigning(docusignRequest);

    // // Update proposal with envelope ID
    // const { error: envelopeUpdateError } = await supabase
    //   .from("proposals")
    //   .update({
    //     envelope_id: signingResponse.envelopeId,
    //     business_recipient_id: docusignRequest.signerClientUserId,
    //   })
    //   .eq("id", proposal.id);

    // if (envelopeUpdateError) {
    //   console.error(
    //     "Error updating proposal with envelope ID:",
    //     envelopeUpdateError
    //   );
    //   return NextResponse.json(
    //     { error: "Failed to update proposal with envelope ID", success: false },
    //     { status: 500 }
    //   );
    // }

    revalidateTag("reimbursement-plan-page");


    return NextResponse.json({
      success: true,
      data: {
        ...proposal,
        // envelope_id: signingResponse.envelopeId,
        signature_doc_url: s3Result.url,
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
