import { EventDatabaseWithAllData, ProposalDatabase } from "@/@types";
import {
  createTaxPacketPDF,
  generateTaxPacketData,
} from "@/html-to-pdf/send-packet";
import { deleteFileFromS3 } from "@/lib/s3-utils";
import { generateRandomString } from "@/lib/string-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const { data: subscriberProfile, error: subscriberProfileError } =
    await supabase
      .from("subscriber_profile")
      .select("*, reimbursement_plan:reimbursement_plan_id (*)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

  if (subscriberProfileError || !subscriberProfile) {
    return NextResponse.json(
      { error: "Failed to fetch subscriber profile" },
      { status: 500 }
    );
  }

  if (subscriberProfile.is_free_subscription_active) {
    return NextResponse.json(
      { error: "Subscriber is on free subscription" },
      { status: 400 }
    );
  }

  const params = new URL(request.url);
  const selectedYear = params.searchParams.get("selected_year");
  if (!selectedYear) {
    return NextResponse.json(
      { error: "Selected year is required" },
      { status: 400 }
    );
  }

  const reimbursementPlan = subscriberProfile.reimbursement_plan;

  if (!reimbursementPlan || !reimbursementPlan.is_signature_done) {
    return NextResponse.json(
      { error: "Reimbursement Plan document signature is pending!" },
      {
        status: 400,
      }
    );
  }

  const { data: unTypedEvents, error: eventsError } = await supabase
    .from("events")
    .select(
      `
        *,
        defendability_scores:defendability_scores!defendability_score_id (*),
        event_documents (*),
        daily_amounts (*),
        rental_address:user_addresses!rental_address_id (*),
        business_address:user_addresses!business_address_id (*),
        rental_agreement:proposals!rental_agreement_id (*),
        event_invoices (*)
      `
    )
    .eq("created_by", user.id)
    .eq("year", selectedYear);

  if (eventsError || !unTypedEvents || unTypedEvents.length === 0) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }

  const events = unTypedEvents as unknown as EventDatabaseWithAllData[];

  if (events?.some((each) => !each.is_completed_event)) {
    return NextResponse.json(
      { error: "Some events have not been completed yet." },
      { status: 400 }
    );
  }

  if (events.some((each) => !each.rental_agreement)) {
    return NextResponse.json(
      { error: "Rental Agreement not found!" },
      { status: 400 }
    );
  }

  if (
    events?.some(
      (each) =>
        !each.rental_agreement.is_business_signature_done &&
        !each.rental_agreement.is_signature_done
    )
  ) {
    return NextResponse.json(
      { error: "Rental Agreement document signature is pending!" },
      { status: 400 }
    );
  }

  const { data: isPacketExists, error: isPacketExistsError } = await supabase
    .from("send_packets")
    .select("*")
    .eq("created_by", user.id)
    .eq("year", selectedYear)
    .not("pdf_path", "is", null)
    .neq("pdf_path", "")
    .limit(1)
    .single();

  if (isPacketExistsError && isPacketExistsError.code !== "PGRST116") {
    console.error("Error fetching is packet exists:", isPacketExistsError);
    return NextResponse.json(
      { error: "Failed to fetch is packet exists" },
      { status: 500 }
    );
  }

  if (isPacketExists && isPacketExists.pdf_path) {
    try {
      await deleteFileFromS3(isPacketExists.pdf_path);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
    }
  }

  const saveData = {
    _events: [] as string[],
    _createdBy: user.id,
    status: "pending",
    packetId: generateRandomString({
      length: 8,
      uppercase: true,
      lowercase: true,
    }),
    reimbursementPlan: reimbursementPlan?.signature_doc_url || "",
    rentalAgreement: [] as ProposalDatabase[],
    events: [] as EventDatabaseWithAllData[],
    totalEvents: events.length,
    eventsCsvLink: "",
    year: selectedYear,
    amount: 0,
    pdfPath: "",
  };

  const taxPacketData = await generateTaxPacketData(
    user.id,
    Number(selectedYear),
    unTypedEvents as unknown as EventDatabaseWithAllData[],
    reimbursementPlan,
    subscriberProfile.is_already_have_reimbursement_plan
  );

  if (!taxPacketData) {
    return NextResponse.json(
      { error: "Failed to generate tax packet data" },
      { status: 500 }
    );
  }

  const taxPacketPDFDataSafeParsed = await createTaxPacketPDF(
    taxPacketData,
    events,
    selectedYear,
    saveData,
  );

  return NextResponse.json(taxPacketPDFDataSafeParsed);
}
