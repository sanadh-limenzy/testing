import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { eventFormSchema, EventFormData } from "@/@types/validation";
import {
  DailyAmountDatabase,
  DefendabilityScoreDatabase,
  EventDatabase,
  PlanDatabase,
  UserAddress,
} from "@/@types/index";
import { generateRandomString } from "@/lib/string-utils";
import { eventInvoiceToHtml } from "@/html-to-pdf/event-invoice";
import { UserProfile } from "@/@types/user";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";

export const dynamic = "force-dynamic";

interface CreateEventRequest {
  event: EventFormData;
}

interface CreateEventResponse {
  success: boolean;
  data?: EventDatabase;
  error?: string;
  message?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateEventResponse>> {
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

    const { data: subscriberProfile, error: subscriberProfileError } =
      await supabase
        .from("subscriber_profile")
        .select(
          "*, plan:plans!fk_subscriber_profile_plan (*), user:user_profile!user_id (*)"
        )
        .eq("user_id", user.id)
        .single();

    if (subscriberProfileError || !subscriberProfile) {
      console.error(
        "Error fetching subscriber profile:",
        subscriberProfileError
      );
      return NextResponse.json(
        { error: "Subscriber profile not found", success: false },
        { status: 404 }
      );
    }

    // Parse request body
    let body: CreateEventRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body", success: false },
        { status: 400 }
      );
    }

    if (!body.event) {
      return NextResponse.json(
        { error: "Event data is required", success: false },
        { status: 400 }
      );
    }

    const eventData = body.event;

    // Validate the event data
    try {
      eventFormSchema.parse(eventData);
    } catch (validationError: unknown) {
      const error = validationError as {
        errors?: Array<{ message: string; path: string[] }>;
      };
      return NextResponse.json(
        {
          error: "Validation failed",
          success: false,
          details: error.errors || [],
        },
        { status: 400 }
      );
    }

    const { data: businessAddress, error: businessAddressError } =
      await supabase
        .from("user_addresses")
        .select("*")
        .eq("id", eventData.business_address_id)
        .single();

    if (businessAddressError) {
      console.error("Error fetching business address:", businessAddressError);
    }

    // Get rental address from the event data
    if (!eventData.residence) {
      return NextResponse.json(
        { error: "Property (rental address) is required", success: false },
        { status: 400 }
      );
    }

    // Verify rental address belongs to the user
    const { data: rentalAddress, error: addressError } = await supabase
      .from("user_addresses")
      .select("id, created_by")
      .eq("id", eventData.residence)
      .eq("created_by", user.id)
      .eq("address_type", "rental")
      .single();

    if (addressError || !rentalAddress) {
      return NextResponse.json(
        { error: "Rental address not found or access denied", success: false },
        { status: 404 }
      );
    }

    // Check for overlapping events in the same rental address
    if (eventData.start_date && eventData.end_date) {
      const { data: overlappingEvents, error: overlapError } = await supabase
        .from("events")
        .select("id, title, start_date, end_date")
        .eq("rental_address_id", eventData.residence)
        .eq("created_by", user.id)
        .lte("start_date", eventData.end_date)
        .gte("end_date", eventData.start_date);

      if (overlapError) {
        console.error("Error checking for overlapping events:", overlapError);
        return NextResponse.json(
          { error: "Failed to validate event dates", success: false },
          { status: 500 }
        );
      }

      if (overlappingEvents && overlappingEvents.length > 0) {
        const overlappingEvent = overlappingEvents[0];
        return NextResponse.json(
          {
            error: `You already have an event "${overlappingEvent.title}" scheduled for this date range. Please choose different dates.`,
            success: false,
            details: {
              conflictingEvent: {
                id: overlappingEvent.id,
                title: overlappingEvent.title,
                start_date: overlappingEvent.start_date,
                end_date: overlappingEvent.end_date,
              },
            },
          },
          { status: 409 }
        );
      }
    }

    // Calculate duration if times are provided
    let duration = 0;
    if (eventData.start_time && eventData.end_time) {
      try {
        const start = new Date(`2000-01-01T${eventData.start_time}:00`);
        const end = new Date(`2000-01-01T${eventData.end_time}:00`);
        const diffInMs = end.getTime() - start.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        // Handle case where end time is on the next day
        if (diffInHours < 0) {
          duration = diffInHours + 24;
        } else {
          duration = diffInHours;
        }
      } catch (error) {
        console.error("Error calculating duration:", error);
      }
    }

    // Get the next event number for the user
    const { data: existingEvents, error: eventCountError } = await supabase
      .from("events")
      .select("event_number")
      .eq("created_by", user.id)
      .order("event_number", { ascending: false })
      .limit(1);

    if (eventCountError) {
      console.error("Error getting event count:", eventCountError);
      return NextResponse.json(
        { error: "Failed to generate event number", success: false },
        { status: 500 }
      );
    }

    const nextEventNumber = existingEvents?.length
      ? (existingEvents[0].event_number || 0) + 1
      : 1;

    // Prepare event data for insertion
    const insertData = {
      created_by: user.id,
      event_number: nextEventNumber,
      title: eventData.title || "",
      description: eventData.description || "",
      people_count: eventData.people_count
        ? parseInt(eventData.people_count.toString())
        : 0,
      people_names: eventData.people_names
        ? eventData.people_names
            .map((person) => person.name)
            .filter((name) => name && name.trim() !== "")
        : [],
      excluded_areas: eventData.excluded_areas || "",
      start_date: eventData.start_date || "",
      end_date: eventData.end_date || "",
      start_time: eventData.start_time || "",
      end_time: eventData.end_time || "",
      year: eventData.start_date
        ? new Date(eventData.start_date).getFullYear()
        : new Date().getFullYear(),
      duration: duration,
      amount: eventData.rental_amount
        ? parseFloat(eventData.rental_amount.toString())
        : 0,
      thumbnails: eventData.thumbnails || [],
      rental_address_id: eventData.residence,
      business_address_id: eventData.business_address_id,
      money_paid_to_personnel: eventData.money_paid_to_personal || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the event
    const { data: createdEvent, error: insertError } = await supabase
      .from("events")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.dir(insertData, { depth: null });
      console.error("Error creating event:", insertError);
      return NextResponse.json(
        { error: "Failed to create event", success: false },
        { status: 500 }
      );
    }

    // Create defendability scores record
    const peopleCount = eventData.people_count
      ? parseInt(eventData.people_count.toString())
      : 0;
    const defendabilityData = {
      event_id: createdEvent.id,
      written_notes: !!(eventData.title && eventData.description),
      digital_valuation: !eventData.manual_valuation,
      evidence_supporting:
        (eventData.manual_valuation &&
          eventData.event_documents &&
          eventData.event_documents.length > 0) ||
        false,
      more_people: peopleCount >= 3,
      money_paid_to_personnel: eventData.money_paid_to_personal || false,
      more_duration: duration >= 4.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: defendabilityError } = await supabase
      .from("defendability_scores")
      .insert(defendabilityData);

    if (defendabilityError) {
      console.error("Error creating defendability scores:", defendabilityError);
      // Don't fail the entire request for this
    }

    // Handle document insertion if provided
    if (eventData.event_documents && eventData.event_documents.length > 0) {
      const documentsData = eventData.event_documents.map((doc) => ({
        event_id: createdEvent.id,
        name: doc.name,
        url: doc.url,
        type: doc.type,
        size: doc.size,
        created_at: new Date().toISOString(),
      }));

      const { error: insertDocsError } = await supabase
        .from("event_documents")
        .insert(documentsData);

      if (insertDocsError) {
        console.error("Error inserting documents:", insertDocsError);
        // Don't fail the entire request for this
      }
    }

    const dailyAmounts: Omit<DailyAmountDatabase, "id">[] = [];

    // Handle daily amounts insertion if provided
    if (eventData.daily_amounts && eventData.daily_amounts.length > 0) {
      const dailyAmountsData = eventData.daily_amounts.map((daily) => {
        const dailyAmount: Omit<DailyAmountDatabase, "id"> = {
          event_id: createdEvent.id,
          date: daily.date,
          amount: daily.amount,
          created_at: new Date().toISOString(),
        };
        dailyAmounts.push(dailyAmount);
        return dailyAmount;
      });

      const { error: insertDailyAmountsError } = await supabase
        .from("daily_amounts")
        .insert(dailyAmountsData);

      if (insertDailyAmountsError) {
        console.error(
          "Error inserting daily amounts:",
          insertDailyAmountsError
        );
        // Don't fail the entire request for this
      }
    }

    const invoiceNumber = generateRandomString({
      length: 8,
      uppercase: true,
    });

    const invoiceDate = new Date().toISOString();

    const html = eventInvoiceToHtml({
      user: subscriberProfile.user as UserProfile,
      invoiceNumber,
      invoiceDate,
      event: createdEvent,
      daily_amounts: dailyAmounts as DailyAmountDatabase[],
      defendabilityScore: defendabilityData as DefendabilityScoreDatabase,
      plan: subscriberProfile.plan as PlanDatabase,
      businessAddress: businessAddress as unknown as UserAddress,
    });

    const result = await pdfService.generatePDF(html, {
      filename: "event-invoice",
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

    const s3Result = await uploadFileToS3(
      result.buffer,
      "event-invoices",
      user.id,
      {
        filename: "event-invoice",
        contentType: "application/pdf",
      }
    );

    // Create event invoice record in database
    if (s3Result.success && s3Result.url) {
      const { data: eventInvoice, error: invoiceError } = await supabase
        .from("event_invoices")
        .insert({
          event_id: createdEvent.id,
          number: invoiceNumber,
          url: s3Result.url,
          date: invoiceDate,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error("Failed to create event invoice record:", invoiceError);
        // Don't fail the entire request, just log the error
      } else {
        console.log("Event invoice created successfully:", eventInvoice);
      }
    }

    return NextResponse.json({
      success: true,
      data: createdEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Error in event creation:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const rentalAddressId = searchParams.get("rental_address_id");
    const year = searchParams.get("year");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build query
    let query = supabase
      .from("events")
      .select(
        `
        *,
        defendability_scores (*),
        event_documents (*),
        daily_amounts (*),
        rental_address:user_addresses!rental_address_id (*)
      `
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (rentalAddressId) {
      query = query.eq("rental_address_id", rentalAddressId);
    }

    if (year) {
      query = query.eq("year", parseInt(year));
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: events || [],
    });
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
