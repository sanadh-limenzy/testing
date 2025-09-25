import { NextRequest, NextResponse } from "next/server";
import { pdfService } from "@/lib/pdf-utils";
import { deleteFileFromS3, uploadFileToS3 } from "@/lib/s3-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signedRentalAgreementToHtml } from "@/html-to-pdf/rental-agreement-forms";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { event_id, lessee_signature, lessor_signature } =
      await request.json();
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

    const { data: proposals, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("event_id", event_id)
      .eq("created_by", user.id)
      .eq("form_type", "Rental_Agreement");

    if (proposalError) {
      return NextResponse.json(
        { error: "Failed to fetch proposal: " + proposalError.message },
        { status: 500 }
      );
    }

    if (!proposals || proposals.length === 0) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const proposal = proposals[0];

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "*, rental_address:user_addresses!rental_address_id(*), business_address:user_addresses!business_address_id(*), daily_amounts(*)"
      )
      .eq("id", event_id)
      .single();

    if (eventError) {
      return NextResponse.json(
        { error: "Failed to fetch event: " + eventError.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

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

    if (proposal.signature_doc_url && proposal.signature_doc_url !== "") {
      await deleteFileFromS3(proposal.signature_doc_url);
    }

    const html = signedRentalAgreementToHtml(
      userData,
      event,
      dailyAmounts,
      event.rental_address,
      event.business_address,
      event.excluded_areas,
      lessee_signature,
      lessor_signature
    );

    const pdfResult = await pdfService.generatePDF(html, {
      filename: `rental-agreement-${event.event_number || event.id}`,
    });
    const s3Result = await uploadFileToS3(
      pdfResult.buffer,
      "rental-agreements",
      user.id,
      {
        filename: "rental-agreement",
        contentType: "application/pdf",
      }
    );
    if (!s3Result.success) {
      return NextResponse.json({
        error: "Failed to upload PDF to storage",
        message: s3Result.error,
      });
    }

    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        signature_doc_url: s3Result.url,
        is_signature_done: true,
        is_business_signature_done: true,
      })
      .eq("id", proposal.id);

    if (updateError) {
      console.error("Failed to update proposal:", updateError);
      return NextResponse.json(
        { error: "Failed to update proposal: " + updateError.message },
        { status: 500 }
      );
    } else {
      console.log("Proposal updated successfully");
    }

    revalidatePath("/subscriber/rental-agreement");
    revalidateTag("rental-agreement-page");

    return NextResponse.json({
      file_name: pdfResult.filename,
      url: s3Result.url,
      message: "Signed rental agreement generated and uploaded successfully",
    });
  } catch (error) {
    console.error("Error in rentalSignedAgreementForm:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
