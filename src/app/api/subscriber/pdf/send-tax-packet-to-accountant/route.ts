import {
  EventDatabaseWithAllData,
  TaxPacketPreviewResponse,
  TaxPacketPreviewError,
  TaxPacketSaveData,
} from "@/@types";
import {
  createTaxPacketPDF,
  generateTaxPacketData,
} from "@/html-to-pdf/send-packet";
import { deleteFileFromS3 } from "@/lib/s3-utils";
import { generateRandomString, generateUsernameFromEmail } from "@/lib/string-utils";
import { createServerSupabaseClient, adminSupabaseServerClient } from "@/lib/supabase/server";
import {
  sendTaxPacketRequestSchema,
  subscriberProfileWithReimbursementPlanSchema,
  taxPacketSaveDataSchema,
} from "@/@types/validation";
import { NextResponse } from "next/server";

export async function POST(
  request: Request
): Promise<NextResponse<TaxPacketPreviewResponse | TaxPacketPreviewError>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Validate user authentication
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

    // Parse and validate request body
    const body = await request.json();

    const bodyValidation = sendTaxPacketRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      console.error("Invalid request parameters:", bodyValidation.error);
      return NextResponse.json(
        {
          error:
            bodyValidation.error.issues[0]?.message ||
            "Invalid request parameters",
        },
        { status: 400 }
      );
    }

    const { email: accountantEmail, selected_year: selectedYear, is_send_to_self: isSendToSelf } = bodyValidation.data;

    // Fetch and validate subscriber profile
    const { data: subscriberProfile, error: subscriberProfileError } =
      await supabase
        .from("subscriber_profile")
        .select("*, reimbursement_plan:reimbursement_plan_id (*)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (subscriberProfileError || !subscriberProfile) {
      console.error(
        "Failed to fetch subscriber profile:",
        subscriberProfileError
      );
      return NextResponse.json(
        { error: "Failed to fetch subscriber profile" },
        { status: 500 }
      );
    }

    // Validate subscriber profile structure
    const profileValidation =
      subscriberProfileWithReimbursementPlanSchema.safeParse(subscriberProfile);
    if (!profileValidation.success) {
      console.error(
        "Invalid subscriber profile structure:",
        profileValidation.error
      );
      return NextResponse.json(
        { error: "Invalid subscriber profile data" },
        { status: 500 }
      );
    }

    const validatedProfile = profileValidation.data;

    if (validatedProfile.is_free_subscription_active) {
      return NextResponse.json(
        { error: "Subscriber is on free subscription" },
        { status: 400 }
      );
    }

    // Validate reimbursement plan
    if (
      !validatedProfile.reimbursement_plan ||
      !validatedProfile.reimbursement_plan.is_signature_done
    ) {
      return NextResponse.json(
        { error: "Reimbursement Plan document signature is pending!" },
        { status: 400 }
      );
    }

    // Fetch events with proper typing
    const { data: unTypedEvents, error: eventsError } = await supabase
      .from("events")
      .select(
        `
            *,
            defendability_scores:defendability_score_id (*),
            event_documents (*),
            daily_amounts (*),
            rental_address:user_addresses!rental_address_id (*),
            business_address:user_addresses!business_address_id (*),
            rental_agreement:proposals!rental_agreement_id (*),
            event_invoices (*)
          `
      )
      .eq("is_draft", false)
      .eq("created_by", user.id)
      .eq("year", selectedYear);

    if (eventsError) {
      console.error("Failed to fetch events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    if (!unTypedEvents || unTypedEvents.length === 0) {
      return NextResponse.json(
        { error: "No events found for the selected year" },
        { status: 404 }
      );
    }

    // Type assertion with validation
    const events = unTypedEvents as EventDatabaseWithAllData[];

    // Validate events data
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Invalid events data format" },
        { status: 500 }
      );
    }

    // Check if all events are completed
    const incompleteEvents = events.filter(
      (event) => !event.is_completed_event
    );
    if (incompleteEvents.length > 0) {
      return NextResponse.json(
        { error: "Some events have not been completed yet." },
        { status: 400 }
      );
    }

    // Check if all events have rental agreements
    const eventsWithoutRentalAgreement = events.filter(
      (event) => !event.rental_agreement
    );
    if (eventsWithoutRentalAgreement.length > 0) {
      return NextResponse.json(
        { error: "Rental Agreement not found!" },
        { status: 400 }
      );
    }

    // Check if all rental agreements are signed
    const unsignedRentalAgreements = events.filter(
      (event) =>
        !event.rental_agreement.is_business_signature_done &&
        !event.rental_agreement.is_signature_done
    );
    if (unsignedRentalAgreements.length > 0) {
      return NextResponse.json(
        { error: "Rental Agreement document signature is pending!" },
        { status: 400 }
      );
    }

    // Check for existing packet - first check if mail has been sent
    const { data: sentPacket, error: sentPacketError } = await supabase
      .from("send_packets")
      .select("*")
      .eq("created_by", user.id)
      .eq("year", selectedYear)
      .eq("is_mail_sent", true)
      .not("pdf_path", "is", null)
      .neq("pdf_path", "")
      .limit(1)
      .single();

    if (sentPacketError && sentPacketError.code !== "PGRST116") {
      console.error("Error fetching sent packet:", sentPacketError);
      return NextResponse.json(
        { error: "Failed to check for sent packet" },
        { status: 500 }
      );
    }

    // If mail has been sent, return the existing PDF
    if (sentPacket && sentPacket.pdf_path) {
      return NextResponse.json({
        success: true,
        data: {
          pdfPath: sentPacket.pdf_path,
          csvLink: sentPacket.events_csv_link || "",
          eventsArray: [], // We don't need to regenerate this data
        },
        error: null,
      }      );
    }

    // Check for accountant info
    let accountantId: string | null = null;
    let accountantProfileId: string | null = null;

    // First, check if user exists with this email
    const { data: existingUser, error: userCheckError } = await supabase
      .from("user_profile")
      .select("id, user_type")
      .eq("email", accountantEmail.toLowerCase())
      .limit(1)
      .single();

    if (userCheckError && userCheckError.code !== "PGRST116") {
      console.error("Error checking for existing user:", userCheckError);
      return NextResponse.json(
        { error: "Failed to check for existing user" },
        { status: 500 }
      );
    }

    if (existingUser) {
      // User exists - check if they are an accountant
      if (existingUser.user_type !== "Accountant") {
        return NextResponse.json(
          { error: `An existing ${existingUser.user_type} is found with the following Email` },
          { status: 400 }
        );
      }
      accountantId = existingUser.id;

      // Get accountant profile ID
      const { data: accountantProfile, error: accountantProfileError } = await supabase
        .from("accountant_profile")
        .select("id")
        .eq("user_id", accountantId)
        .limit(1)
        .single();

      if (accountantProfileError || !accountantProfile) {
        console.error("Error fetching accountant profile:", accountantProfileError);
        return NextResponse.json(
          { error: "Failed to fetch accountant profile" },
          { status: 500 }
        );
      }

      accountantProfileId = accountantProfile.id;
    } else {
      // User doesn't exist - create new accountant
      const username = generateUsernameFromEmail(accountantEmail);
      const randomPassword = generateRandomString({
        length: 12,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      });

      // Create user in Supabase Auth using service role client
      const adminClient = await adminSupabaseServerClient();
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: accountantEmail.toLowerCase(),
        password: randomPassword,
        email_confirm: false,
      });

      if (authError || !authData.user) {
        console.error("Error creating accountant auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create accountant user" },
          { status: 500 }
        );
      }

      // Create user_profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profile")
        .insert({
          id: authData.user.id,
          email: accountantEmail.toLowerCase(),
          username: username,
          first_name: username,
          last_name: "",
          user_type: "Accountant",
          is_active: true,
          is_email_verified: false,
        })
        .select("id")
        .single();

      if (userProfileError || !userProfile) {
        console.error("Error creating user profile:", userProfileError);
        return NextResponse.json(
          { error: "Failed to create accountant profile" },
          { status: 500 }
        );
      }

      accountantId = authData.user.id;

      // Create accountant_profile
      const { data: newAccountantProfile, error: accountantProfileError } = await supabase
        .from("accountant_profile")
        .insert({
          user_id: authData.user.id,
          request_accepted: false,
          invited_by_admin: false,
          total_client_count: 0,
        })
        .select("id")
        .single();

      if (accountantProfileError || !newAccountantProfile) {
        console.error("Error creating accountant profile:", accountantProfileError);
        return NextResponse.json(
          { error: "Failed to create accountant profile" },
          { status: 500 }
        );
      }

      accountantProfileId = newAccountantProfile.id;
    }

    // Update subscriber profile with accountant
    const { error: updateSubscriberError } = await supabase
      .from("subscriber_profile")
      .update({
        accountant_id: accountantProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateSubscriberError) {
      console.error("Error updating subscriber profile:", updateSubscriberError);
      // Continue execution even if this fails
    }

    // Create accountant_clients relationship if it doesn't exist
    const { data: existingRelationship, error: relationshipCheckError } = await supabase
      .from("accountant_clients")
      .select("id")
      .eq("accountant_id", accountantProfileId)
      .eq("client_id", user.id)
      .limit(1)
      .single();

    if (relationshipCheckError && relationshipCheckError.code !== "PGRST116") {
      console.error("Error checking accountant_clients relationship:", relationshipCheckError);
      // Continue execution
    }

    if (!existingRelationship) {
      const { error: insertRelationshipError } = await supabase
        .from("accountant_clients")
        .insert({
          accountant_id: accountantProfileId,
          client_id: user.id,
        });

      if (insertRelationshipError) {
        console.error("Error creating accountant_clients relationship:", insertRelationshipError);
        // Continue execution
      }

      // Increment accountant's total client count
      const { data: currentProfile, error: fetchProfileError } = await supabase
        .from("accountant_profile")
        .select("total_client_count")
        .eq("id", accountantProfileId)
        .single();

      if (!fetchProfileError && currentProfile) {
        const { error: incrementError } = await supabase
          .from("accountant_profile")
          .update({
            total_client_count: (currentProfile.total_client_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountantProfileId);

        if (incrementError) {
          console.error("Error incrementing client count:", incrementError);
        }
      }
    }

    // Check for existing packet that hasn't been sent and clean up if necessary
    const { data: existingPacket, error: packetExistsError } = await supabase
      .from("send_packets")
      .select("*")
      .eq("created_by", user.id)
      .eq("year", selectedYear)
      .eq("is_mail_sent", false)
      .not("pdf_path", "is", null)
      .neq("pdf_path", "")
      .limit(1)
      .single();

    if (packetExistsError && packetExistsError.code !== "PGRST116") {
      console.error("Error fetching existing packet:", packetExistsError);
      return NextResponse.json(
        { error: "Failed to check for existing packet" },
        { status: 500 }
      );
    }

    // Clean up existing PDF if it exists and mail hasn't been sent
    if (existingPacket && existingPacket.pdf_path) {
      try {
        await deleteFileFromS3(existingPacket.pdf_path);
      } catch (error) {
        console.error("Error deleting existing PDF from S3:", error);
        // Continue execution even if cleanup fails
      }
    }

    // Create save data with proper typing
    const saveData: TaxPacketSaveData = {
      _events: [],
      _createdBy: user.id,
      status: "pending",
      packetId: generateRandomString({
        length: 8,
        uppercase: true,
        lowercase: true,
      }),
      reimbursementPlan:
        validatedProfile.reimbursement_plan.signature_doc_url || "",
      rentalAgreement: [],
      events: [],
      totalEvents: events.length,
      eventsCsvLink: "",
      year: selectedYear,
      amount: 0,
      pdfPath: "",
    };

    // Validate save data
    const saveDataValidation = taxPacketSaveDataSchema.safeParse(saveData);
    if (!saveDataValidation.success) {
      console.error("Invalid save data structure:", saveDataValidation.error);
      return NextResponse.json(
        { error: "Invalid save data structure" },
        { status: 500 }
      );
    }

    // Generate tax packet data
    const taxPacketData = await generateTaxPacketData(
      user.id,
      Number(selectedYear),
      events,
      validatedProfile.reimbursement_plan,
      validatedProfile.is_already_have_reimbursement_plan
    );

    if (!taxPacketData) {
      return NextResponse.json(
        { error: "Failed to generate tax packet data" },
        { status: 500 }
      );
    }

    // Create tax packet PDF
    const taxPacketPDFResult = await createTaxPacketPDF(
      taxPacketData,
      events,
      selectedYear,
      saveData
    );

    // Validate the result
    if (!taxPacketPDFResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: taxPacketPDFResult.error || "Failed to create tax packet PDF",
        },
        { status: 500 }
      );
    }

    // Save the PDF path to the database
    if (taxPacketPDFResult.data && taxPacketPDFResult.data.pdfPath) {
      try {
        // Check if there's an existing record to update or if we need to create a new one
        const { data: existingRecord, error: existingError } = await supabase
          .from("send_packets")
          .select("id")
          .eq("created_by", user.id)
          .eq("year", selectedYear)
          .limit(1)
          .single();

        if (existingError && existingError.code !== "PGRST116") {
          console.error("Error checking for existing record:", existingError);
          // Continue execution even if we can't update the database
        } else if (existingRecord) {
          // Update existing record and mark as sent
          const { error: updateError } = await supabase
            .from("send_packets")
            .update({
              pdf_path: taxPacketPDFResult.data.pdfPath,
              packet_id: saveData.packetId,
              total_events: events.length,
              events_csv_link: taxPacketPDFResult.data.csvLink,
              amount: taxPacketData.taxDeductions.totalDeduction || 0,
              accountant_id: accountantId,
              cpa_emails: [accountantEmail],
              is_send_to_self: isSendToSelf,
              is_mail_sent: true,
              status: "sent",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRecord.id);

          if (updateError) {
            console.error("Error updating existing record:", updateError);
          }
        } else {
          // Create new record and mark as sent
          const { error: insertError } = await supabase
            .from("send_packets")
            .insert({
              created_by: user.id,
              pdf_path: taxPacketPDFResult.data.pdfPath,
              packet_id: saveData.packetId,
              total_events: events.length,
              events_csv_link: taxPacketPDFResult.data.csvLink,
              year: selectedYear,
              amount: taxPacketData.taxDeductions.totalDeduction || 0,
              accountant_id: accountantId,
              cpa_emails: [accountantEmail],
              is_send_to_self: isSendToSelf,
              status: "sent",
              is_mail_sent: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error("Error creating new record:", insertError);
          }
        }
      } catch (error) {
        console.error("Error saving PDF path to database:", error);
        // Continue execution even if database update fails
      }
    }

    return NextResponse.json(taxPacketPDFResult);
  } catch (error) {
    console.error(
      "Unexpected error in sending tax packet to accountant:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "An unexpected error occurred while sending the tax packet",
      },
      { status: 500 }
    );
  }
}
