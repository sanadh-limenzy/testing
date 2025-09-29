import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the event with rental agreement details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        rental_agreement:proposals!rental_agreement_id(
          id,
          is_signature_done,
          is_business_signature_done,
          signature_doc_url
        )
      `
      )
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event end date has passed
    const endDate = new Date(event.end_date);
    const now = new Date();

    if (endDate > now) {
      return NextResponse.json(
        { error: "Event end date has not passed yet" },
        { status: 400 }
      );
    }

    // Check if rental agreement is signed
    const rentalAgreement = event.rental_agreement;
    if (
      !rentalAgreement ||
      (!rentalAgreement.is_signature_done &&
        !rentalAgreement.is_business_signature_done)
    ) {
      return NextResponse.json(
        {
          error: "Rental agreement must be signed before completing the event",
        },
        { status: 400 }
      );
    }

    // Check if event is already completed
    if (event.is_completed_event) {
      return NextResponse.json(
        { error: "Event is already completed" },
        { status: 400 }
      );
    }

    // Update event to completed
    const { error: updateError } = await supabase
      .from("events")
      .update({
        is_completed_event: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id);

    if (updateError) {
      console.error("Error completing event:", updateError);
      return NextResponse.json(
        { error: "Failed to complete event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event completed successfully",
    });
  } catch (error) {
    console.error("Error completing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
