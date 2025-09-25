import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reimbursementPlanToHtml } from "@/html-to-pdf/reimbursement-plan";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { business_signature, proposal_id, business_address_id } = body;

    if (!business_signature || !proposal_id || !business_address_id) {
      return NextResponse.json(
        { error: "Business signature is required" },
        { status: 400 }
      );
    }

    let proposal = null;

    const { data: existingProposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .eq("created_by", user.id)
      .eq("form_type", "Reimbursement_Plan")
      .single();

    if (proposalError && proposalError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to fetch proposal: " + proposalError.message },
        { status: 500 }
      );
    }
    if (existingProposal) {
      proposal = existingProposal;
    }

    if (!proposal) {
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

      const { data: newProposal, error: proposalError } = await supabase
        .from("proposals")
        .insert({
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
        })
        .select()
        .single();
      if (proposalError) {
        return NextResponse.json(
          { error: "Failed to create proposal", success: false },
          { status: 500 }
        );
      }

      proposal = newProposal;
    }

    const { data: businessAddress, error: businessAddressError } =
      await supabase
        .from("user_addresses")
        .select("*")
        .eq("id", business_address_id)
        .single();

    if (businessAddressError && businessAddressError.code !== "PGRST116") {
      return NextResponse.json(
        {
          error:
            "Failed to fetch business address: " + businessAddressError.message,
        },
        { status: 500 }
      );
    }

    if (!businessAddress) {
      return NextResponse.json(
        { error: "Business address not found" },
        { status: 404 }
      );
    }

    try {
      const html = reimbursementPlanToHtml(business_signature);

      const pdfResult = await pdfService.generatePDF(html, {
        filename: "reimbursement-plan",
        orientation: "portrait",
        paperSize: "a4",
        printBackground: true,
      });

      // Upload the signed PDF to S3
      const uploadResponse = await uploadFileToS3(
        pdfResult.buffer,
        "reimbursement-plans",
        user.id,
        {
          filename: "reimbursement-plan",
          contentType: "application/pdf",
        }
      );
      if (!uploadResponse.success) {
        return NextResponse.json(
          { error: "Failed to upload signed PDF" },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          is_signature_done: true,
          is_business_signature_done: true,
          updated_at: new Date().toISOString(),
          signature_doc_url: uploadResponse.url,
        })
        .eq("id", proposal_id)
        .eq("created_by", user.id)
        .eq("form_type", "Reimbursement_Plan")
        .select();

      if (updateError) {
        console.error("Error updating reimbursement plan:", updateError);
        return NextResponse.json(
          { error: "Failed to update reimbursement plan" },
          { status: 500 }
        );
      }

      revalidateTag("reimbursement-plan-page");

      return NextResponse.json({
        success: true,
        message: "Reimbursement plan signed successfully",
        data: {
          signature_doc_url: uploadResponse.url,
          is_business_signature_done: true,
          is_signature_done: true,
        },
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      return NextResponse.json(
        { error: "Failed to generate signed PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in sign reimbursement plan API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
