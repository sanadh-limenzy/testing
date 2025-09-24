import { NextRequest, NextResponse } from "next/server";
import { pdfService } from "@/lib/pdf-utils";
import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rentalAgreementToHtml } from "@/html-to-pdf/rental-agreement-forms";
export interface PDFOptions {
  filename: string;
  orientation?: "portrait" | "landscape";
  paperSize?: "A4" | "Letter" | "Legal";
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  timeout?: number;
  headerTemplate?: string;
  footerTemplate?: string;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { event_id, use_system_generated } = await request.json();

    if (
      !event_id ||
      typeof event_id !== "string" ||
      event_id === "" ||
      event_id === null ||
      event_id === undefined ||
      event_id === "undefined"
    ) {
      console.error("Event ID is required");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

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

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        rental_address:user_addresses!rental_address_id(*),
        business_address:user_addresses!business_address_id(*),
        daily_amounts(*)
      `
      )
      .eq("id", event_id)
      .eq("created_by", user.id)
      .single();

    if (eventError) {
      console.error("Event error:", eventError);
      if (eventError.code === "PGRST116") {
        return NextResponse.json({
          error: "Event not found or you don't have permission to access it",
        });
      }
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: existingProposals, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("event_id", event_id)
      .eq("created_by", user.id)
      .eq("form_type", "Rental_Agreement");

    let proposal = null;

    // Check if proposal already exists
    if (existingProposals && existingProposals.length > 0) {
      proposal = existingProposals[0];

      // If multiple proposals exist, delete the extras and keep only the first one
      if (existingProposals.length > 1) {
        const extraProposalIds = existingProposals.slice(1).map((p) => p.id);
        await supabase.from("proposals").delete().in("id", extraProposalIds);
        console.log(
          `Deleted ${extraProposalIds.length} duplicate proposals for event ${event_id}`
        );
      }
    }

    // If no proposal exists, create one
    if (!proposal) {
      // Generate a random proposal ID
      const generateProposalId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      };

      const { data: newProposal, error: createError } = await supabase
        .from("proposals")
        .insert({
          event_id: event_id,
          event_number: event.event_number,
          proposal_id: generateProposalId(),
          created_by: user.id,
          form_type: "Rental_Agreement",
          year: event.year || new Date().getFullYear(),
          rental_address_id: event.rental_address_id,
          business_address_id: event.business_address_id,
          is_signature_done: false,
          is_business_signature_done: false,
          is_mail_sent_to_business: false,
          is_mail_sent_to_user: false,
          is_manual_agreement: false,
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create proposal:", createError);
        return NextResponse.json(
          { error: "Failed to create proposal: " + createError.message },
          { status: 500 }
        );
      }

      proposal = newProposal;

      const { error: updateEventError } = await supabase
        .from("events")
        .update({ rental_agreement_id: proposal.id })
        .eq("id", event_id);

      if (updateEventError) {
        console.error(
          "Failed to update event with proposal ID:",
          updateEventError
        );
        // Don't fail the request, just log the error
      }
    } else if (proposalError) {
      console.error("Failed to fetch proposals:", proposalError);
      return NextResponse.json(
        { error: "Failed to fetch proposals: " + proposalError.message },
        { status: 500 }
      );
    }

    // Handle "use system generated" flag
    if (use_system_generated && proposal) {
      // Update proposal to mark it as system generated
      const { error: updateProposalError } = await supabase
        .from("proposals")
        .update({
          is_manual_agreement: false,
          is_signature_done: false,
          is_business_signature_done: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.id);

      if (updateProposalError) {
        console.error(
          "Failed to update proposal to system generated:",
          updateProposalError
        );
      }

      // Delete existing manual agreement file if it exists
      if (proposal.signature_doc_url && proposal.is_manual_agreement) {
        await deleteFileFromS3(proposal.signature_doc_url);
      }
    }

    if (
      proposal &&
      proposal.signature_doc_url &&
      proposal.signature_doc_url !== "" &&
      !use_system_generated
    ) {
      if (
        proposal.is_signature_done === false ||
        proposal.is_business_signature_done === false
      ) {
        await deleteFileFromS3(proposal.signature_doc_url);
      } else {
        return NextResponse.json(
          {
            ...proposal,
          },
          { status: 200 }
        );
      }
    }

    // Extract the daily amounts from the event data
    const dailyAmounts = (event.daily_amounts || []).map(
      (amount: { date: string; amount: number }) => ({
        date: amount.date,
        amount: amount.amount,
      })
    );

    const { data: userData, error: userError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Failed to fetch user data:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data: " + userError.message },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: "User data not found" },
        { status: 404 }
      );
    }

    const html = rentalAgreementToHtml(
      userData,
      event,
      dailyAmounts,
      event.rental_address,
      event.business_address,
      event.excluded_areas
    );

    const result = await pdfService.generatePDF(html, {
      filename: "rental-agreement",
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
    const s3Result = await uploadFileToS3(
      result.buffer,
      "rental-agreements",
      user.id,
      {
        filename: "rental-agreement",
        contentType: "application/pdf",
      }
    );

    if (s3Result.success) {
      const { data: updatedProposal, error: updateError } = await supabase
        .from("proposals")
        .update({ signature_doc_url: s3Result.url })
        .eq("id", proposal.id)
        .select()
        .single();
      if (updateError) {
        console.error("Failed to update proposal:", updateError);
        return NextResponse.json(
          { error: "Failed to update proposal: " + updateError.message },
          { status: 500 }
        );
      }
      proposal = updatedProposal;
    }

    return NextResponse.json(proposal, { status: 200 });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  } finally {
  }
}
