import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { eventFormSchema } from "@/@types/validation";
import { deleteMultipleFilesFromS3 } from "@/lib/s3-utils";
import { generateRandomString } from "@/lib/string-utils";
import { eventInvoiceToHtml } from "@/html-to-pdf/event-invoice";
import { UserProfile } from "@/@types/user";
import { pdfService } from "@/lib/pdf-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";
import {
  DailyAmountDatabase,
  DefendabilityScoreDatabase,
  EventDatabaseWithAllData,
  PlanDatabase,
  UserAddress,
} from "@/@types/index";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch the event with related data including rental address
    const { data: event } = await supabase
      .from("events")
      .select(
        `
        *,
        defendability_scores!inner (
        *
        ),
        event_documents (
        *
        ),
        daily_amounts (
        *
        ),
        event_invoices (
        *
        ),
        rental_address:user_addresses!rental_address_id (
        *
        ),
        rental_agreement:proposals!rental_agreement_id(
        *
        )
      `
      )
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: residence, error: residenceError } = await supabase
      .from("residences")
      .select("*")
      .eq("address_id", event.rental_address.mongo_id)
      .single();
    if (residenceError) {
      console.error("Error fetching residence:", residenceError);
    }

    event.rental_address.is_custom_plan = residence?.custom_plan_id
      ? true
      : false;
    event.rental_address.avarage_value = residence?.average_value;

    // Format residence from rental address
    const rentalAddress =
      event.rental_address && Array.isArray(event.rental_address)
        ? event.rental_address[0]
        : event.rental_address;
    const residenceUpdated = rentalAddress
      ? [
          rentalAddress.street,
          rentalAddress.apartment,
          rentalAddress.city,
          rentalAddress.state,
          rentalAddress.zip,
          rentalAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        residence: residenceUpdated,
      },
    });
  } catch (error) {
    console.error("Error in event fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.event) {
      return NextResponse.json(
        { error: "Event data is required" },
        { status: 400 }
      );
    }

    const eventData = body.event;

    // Validate the event data
    try {
      eventFormSchema.parse(eventData);
    } catch (validationError: unknown) {
      console.log("Validation error:", validationError);
      const error = validationError as {
        errors?: Array<{ message: string; path: string[] }>;
      };
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors || [],
        },
        { status: 400 }
      );
    }

    // First, verify the event exists and belongs to the user
    const { data: existingEvent, error: fetchError } = await supabase
      .from("events")
      .select("id, created_by, duration, thumbnails, defendability_score_id, event_invoice_id")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // Check for overlapping events in the same rental address (excluding current event)
    if (eventData.start_date && eventData.end_date) {
      const { data: overlappingEvents, error: overlapError } = await supabase
        .from("events")
        .select("id, title, start_date, end_date")
        .eq("rental_address_id", eventData.residence)
        .eq("created_by", user.id)
        .neq("id", id) // Exclude current event
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
    let duration = existingEvent.duration;
    if (eventData.start_time && eventData.end_time) {
      const startTime = eventData.start_time;
      const endTime = eventData.end_time;

      try {
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map form data to database fields
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined)
      updateData.description = eventData.description;
    if (eventData.people_count !== undefined)
      updateData.people_count = parseInt(eventData.people_count) || 0;
    if (eventData.people_names !== undefined)
      updateData.people_names = eventData.people_names
        ? eventData.people_names
            .map((person: { name: string }) => person.name)
            .filter((name: string) => name && name.trim() !== "")
        : [];
    if (eventData.excluded_areas !== undefined)
      updateData.excluded_areas = eventData.excluded_areas;
    if (eventData.rental_amount !== undefined)
      updateData.amount = parseFloat(eventData.rental_amount) || 0;
    if (duration !== undefined) updateData.duration = duration;
    // Handle thumbnails with S3 cleanup for removed ones
    if (eventData.thumbnails !== undefined) {
      // Get existing thumbnails
      const currentThumbnails = existingEvent.thumbnails || [];
      const newThumbnails = eventData.thumbnails || [];

      // Find thumbnails to delete (existing but not in new list)
      const thumbnailsToDelete = currentThumbnails.filter(
        (thumbnail: string) => !newThumbnails.includes(thumbnail)
      );

      // Delete removed thumbnails from S3
      if (thumbnailsToDelete.length > 0) {
        const s3DeleteResult = await deleteMultipleFilesFromS3(
          thumbnailsToDelete
        );

        if (s3DeleteResult.failed.length > 0) {
          console.error(
            "Failed to delete some thumbnails from S3:",
            s3DeleteResult.failed
          );
        }
      }

      updateData.thumbnails = eventData.thumbnails;
    }
    if (eventData.money_paid_to_personal !== undefined)
      updateData.money_paid_to_personnel = eventData.money_paid_to_personal;

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event:", updateError);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    // Update defendability scores if provided
    if (
      eventData.manual_valuation !== undefined ||
      eventData.money_paid_to_personal !== undefined
    ) {
      const defendabilityUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (eventData.money_paid_to_personal !== undefined) {
        defendabilityUpdate.money_paid_to_personnel =
          eventData.money_paid_to_personal;
      }
      if (eventData.manual_valuation !== undefined) {
        defendabilityUpdate.digital_valuation = !eventData.manual_valuation;
      }

      if (existingEvent.defendability_score_id) {
        const { error: defendabilityError } = await supabase
          .from("defendability_scores")
          .update(defendabilityUpdate)
          .eq("id", existingEvent.defendability_score_id);

        if (defendabilityError) {
          console.error(
            "Error updating defendability scores:",
            defendabilityError
          );
          // Don't fail the entire request for this
        }
      } else {
        console.log("No defendability_score_id found for event, skipping defendability scores update");
      }
    }

    // Handle document updates if provided
    if (eventData.event_documents !== undefined) {
      // Get existing documents
      const { data: existingDocs } = await supabase
        .from("event_documents")
        .select("id, url")
        .eq("event_id", id);

      const currentDocUrls = existingDocs?.map((doc) => doc.url) || [];
      const newDocUrls = eventData.event_documents.map(
        (doc: { url: string }) => doc.url
      );

      // Find documents to delete (existing but not in new list)
      const docsToDelete =
        existingDocs?.filter((doc) => !newDocUrls.includes(doc.url)) || [];

      // Find documents to add (in new list but not existing)
      const docsToAdd = eventData.event_documents.filter(
        (doc: { url: string }) => !currentDocUrls.includes(doc.url)
      );

      // Delete removed documents from database
      if (docsToDelete.length > 0) {
        const docIdsToDelete = docsToDelete.map((doc) => doc.id);
        const { error: deleteDocsError } = await supabase
          .from("event_documents")
          .delete()
          .in("id", docIdsToDelete);

        if (deleteDocsError) {
          console.error("Error deleting documents:", deleteDocsError);
        }

        // Delete files from S3
        const urlsToDelete = docsToDelete.map((doc) => doc.url);
        const s3DeleteResult = await deleteMultipleFilesFromS3(urlsToDelete);

        if (s3DeleteResult.failed.length > 0) {
          console.error(
            "Failed to delete some files from S3:",
            s3DeleteResult.failed
          );
        }
      }

      // Insert new documents
      if (docsToAdd.length > 0) {
        const documentsData = docsToAdd.map(
          (doc: {
            id: string;
            name: string;
            url: string;
            type: string;
            size: number;
            created_at: string;
          }) => ({
            event_id: id,
            name: doc.name,
            url: doc.url,
            type: doc.type,
            size: doc.size,
          })
        );

        const { error: insertDocsError } = await supabase
          .from("event_documents")
          .insert(documentsData);

        if (insertDocsError) {
          console.error("Error inserting documents:", insertDocsError);
          // Don't fail the entire request for this
        }
      }
    }

    // Handle daily amounts updates if provided
    if (eventData.daily_amounts !== undefined) {
      // Delete existing daily amounts
      const { error: deleteDailyAmountsError } = await supabase
        .from("daily_amounts")
        .delete()
        .eq("event_id", id);

      if (deleteDailyAmountsError) {
        console.error(
          "Error deleting existing daily amounts:",
          deleteDailyAmountsError
        );
      }

      // Insert new daily amounts
      if (eventData.daily_amounts.length > 0) {
        const dailyAmountsData = eventData.daily_amounts.map(
          (daily: { date: string; amount: number }) => ({
            event_id: id,
            date: daily.date,
            amount: daily.amount,
            created_at: new Date().toISOString(),
          })
        );

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
    }

    // Delete rental agreement if it exists
    try {
      // Get the updated event to check for rental agreement
      const { data: eventWithRental, error: rentalFetchError } = await supabase
        .from("events")
        .select("rental_agreement_id")
        .eq("id", id)
        .eq("created_by", user.id)
        .single();

      if (rentalFetchError) {
        console.error(
          "Error fetching event rental agreement:",
          rentalFetchError
        );
      } else if (eventWithRental?.rental_agreement_id) {
        // Get the rental agreement proposal to get the PDF URL
        const { data: proposal, error: proposalError } = await supabase
          .from("proposals")
          .select("id, signature_doc_url")
          .eq("id", eventWithRental.rental_agreement_id)
          .single();

        if (proposalError) {
          console.error(
            "Error fetching rental agreement proposal:",
            proposalError
          );
        } else if (proposal) {
          // Delete the rental agreement PDF from S3
          if (proposal.signature_doc_url) {
            const s3DeleteResult = await deleteMultipleFilesFromS3([
              proposal.signature_doc_url,
            ]);
            if (s3DeleteResult.failed.length > 0) {
              console.error(
                "Failed to delete rental agreement PDF from S3:",
                s3DeleteResult.failed
              );
            } else {
              console.log("Successfully deleted rental agreement PDF from S3");
            }
          }

          // Delete the rental agreement from proposals table
          const { error: proposalDeleteError } = await supabase
            .from("proposals")
            .delete()
            .eq("id", eventWithRental.rental_agreement_id);

          if (proposalDeleteError) {
            console.error(
              "Error deleting rental agreement proposal:",
              proposalDeleteError
            );
          } else {
            console.log("Successfully deleted rental agreement proposal");
          }

          // Update the event to remove rental_agreement_id
          const { error: updateEventError } = await supabase
            .from("events")
            .update({ rental_agreement_id: null })
            .eq("id", id)
            .eq("created_by", user.id);

          if (updateEventError) {
            console.error(
              "Error updating event to remove rental agreement ID:",
              updateEventError
            );
          } else {
            console.log("Successfully removed rental agreement ID from event");
          }
        }
      }
    } catch (rentalError) {
      console.error("Error deleting rental agreement:", rentalError);
      // Don't fail the entire request for rental agreement deletion errors
    }

    // Recreate invoice with updated event data
    try {
      // Get subscriber profile for invoice generation
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
          "Error fetching subscriber profile for invoice recreation:",
          subscriberProfileError
        );
      } else {
        // Get complete updated event data with all relations
        const { data: completeEvent, error: completeEventError } =
          await supabase
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
            .eq("id", id)
            .eq("created_by", user.id)
            .single();

        if (completeEventError || !completeEvent) {
          console.error(
            "Error fetching complete event data for invoice:",
            completeEventError
          );
        } else {
          // Get business address
          const { data: businessAddress, error: businessAddressError } =
            await supabase
              .from("user_addresses")
              .select("*")
              .eq("id", completeEvent.business_address_id)
              .single();

          if (businessAddressError) {
            console.error(
              "Error fetching business address for invoice:",
              businessAddressError
            );
          }

          // Get existing invoice to update
          const { data: existingInvoice, error: invoiceError } = existingEvent.event_invoice_id
            ? await supabase
                .from("event_invoices")
                .select("*")
                .eq("id", existingEvent.event_invoice_id)
                .single()
            : { data: null, error: null };

          if (invoiceError || !existingInvoice) {
            console.error("Error fetching existing invoice:", invoiceError);
            console.log("No existing invoice found, skipping invoice recreation");
          } else {
            // Generate new invoice number and date
            const invoiceNumber = generateRandomString({
              length: 8,
              uppercase: true,
            });
            const invoiceDate = new Date().toISOString();

            // Generate HTML for the invoice
            const html = eventInvoiceToHtml({
              user: subscriberProfile.user as UserProfile,
              invoiceNumber,
              invoiceDate,
              event: completeEvent as EventDatabaseWithAllData,
              daily_amounts: (completeEvent.daily_amounts ||
                []) as DailyAmountDatabase[],
              defendabilityScore:
                completeEvent.defendability_scores as DefendabilityScoreDatabase,
              plan: subscriberProfile.plan as PlanDatabase,
              businessAddress: businessAddress as unknown as UserAddress,
            });

            // Generate PDF
            const result = await pdfService.generatePDF(html, {
              filename: "event-invoice",
            });

            // Upload new PDF to S3
            const s3Result = await uploadFileToS3(
              result.buffer,
              "event-invoices",
              user.id,
              {
                filename: "event-invoice",
                contentType: "application/pdf",
              }
            );

            if (s3Result.success && s3Result.url) {
              // Delete old invoice from S3
              if (existingInvoice.url) {
                const s3DeleteResult = await deleteMultipleFilesFromS3([
                  existingInvoice.url,
                ]);
                if (s3DeleteResult.failed.length > 0) {
                  console.error(
                    "Failed to delete old invoice from S3:",
                    s3DeleteResult.failed
                  );
                }
              }

              // Update invoice record in database
              const { error: updateInvoiceError } = await supabase
                .from("event_invoices")
                .update({
                  number: invoiceNumber,
                  url: s3Result.url,
                  date: invoiceDate,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingInvoice.id);

              if (updateInvoiceError) {
                console.error(
                  "Failed to update event invoice record:",
                  updateInvoiceError
                );
              } else {
                console.log("Event invoice updated successfully");
              }
            }
          }
        }
      }
    } catch (invoiceError) {
      console.error("Error recreating invoice:", invoiceError);
      // Don't fail the entire request for invoice recreation errors
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error in event update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // First, get the event to verify ownership
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, created_by, rental_agreement_id, event_invoice_id, defendability_score_id, thumbnails")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (eventError || !event) {
      console.log({ user_id: user.id, event_id: id });
      console.error("Error fetching event:", eventError);
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch related data separately
    const [eventDocsResult, eventInvoicesResult, proposalResult] =
      await Promise.all([
        supabase.from("event_documents").select("id, url").eq("event_id", id),
        event.event_invoice_id
          ? supabase
              .from("event_invoices")
              .select("id, url")
              .eq("id", event.event_invoice_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
        event.rental_agreement_id
          ? supabase
              .from("proposals")
              .select("id, signature_doc_url")
              .eq("id", event.rental_agreement_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

    const eventDocuments = eventDocsResult.data || [];
    const eventInvoices = eventInvoicesResult.data ? [eventInvoicesResult.data] : [];
    const proposal = proposalResult.data;

    // Delete related records that don't have CASCADE delete
    // 1. Delete event invoices
    const { error: invoiceDeleteError } = event.event_invoice_id
      ? await supabase
          .from("event_invoices")
          .delete()
          .eq("id", event.event_invoice_id)
      : { error: null };

    if (invoiceDeleteError) {
      console.error("Error fetching event:", eventError);
      console.error("Error deleting event invoices:", invoiceDeleteError);
    }

    // 2. Delete event documents
    const { error: documentsDeleteError } = await supabase
      .from("event_documents")
      .delete()
      .eq("event_id", id);

    if (documentsDeleteError) {
      console.error("Error deleting event documents:", documentsDeleteError);
    }

    // 3. Delete daily amounts
    const { error: dailyAmountsDeleteError } = await supabase
      .from("daily_amounts")
      .delete()
      .eq("event_id", id);

    if (dailyAmountsDeleteError) {
      console.error("Error deleting daily amounts:", dailyAmountsDeleteError);
    }

    // 4. Delete defendability scores
    const { error: defendabilityDeleteError } = event.defendability_score_id
      ? await supabase
          .from("defendability_scores")
          .delete()
          .eq("id", event.defendability_score_id)
      : { error: null };

    if (defendabilityDeleteError) {
      console.error(
        "Error deleting defendability scores:",
        defendabilityDeleteError
      );
    }

    // 5. Delete rental agreement from proposals table
    if (event.rental_agreement_id) {
      const { error: proposalDeleteError } = await supabase
        .from("proposals")
        .delete()
        .eq("id", event.rental_agreement_id);

      if (proposalDeleteError) {
        console.error("Error deleting proposal:", proposalDeleteError);
      } else {
        console.log("Successfully deleted rental agreement proposal");
      }
    }

    // 6. Update transactions to set event_id to null (SET NULL constraint)
    const { error: transactionsUpdateError } = await supabase
      .from("transactions")
      .update({ event_id: null })
      .eq("event_id", id);

    if (transactionsUpdateError) {
      console.error("Error updating transactions:", transactionsUpdateError);
    }

    // 7. Delete S3 files before deleting the event
    const s3UrlsToDelete: string[] = [];

    // Add thumbnail URLs
    if (event.thumbnails && Array.isArray(event.thumbnails)) {
      s3UrlsToDelete.push(...event.thumbnails);
    }

    // Add event document URLs
    if (eventDocuments && Array.isArray(eventDocuments)) {
      const docUrls = eventDocuments.map((doc) => doc.url).filter(Boolean);
      s3UrlsToDelete.push(...docUrls);
    }

    // Add event invoice URLs
    if (eventInvoices && Array.isArray(eventInvoices)) {
      const invoiceUrls = eventInvoices
        .map((invoice) => invoice.url)
        .filter(Boolean);
      s3UrlsToDelete.push(...invoiceUrls);
    }

    // Add rental agreement PDF URL
    if (proposal && proposal.signature_doc_url) {
      s3UrlsToDelete.push(proposal.signature_doc_url);
    }

    // Delete all S3 files
    if (s3UrlsToDelete.length > 0) {
      console.log(
        `Deleting ${s3UrlsToDelete.length} files from S3:`,
        s3UrlsToDelete
      );
      const s3DeleteResult = await deleteMultipleFilesFromS3(s3UrlsToDelete);

      if (s3DeleteResult.failed.length > 0) {
        console.error(
          "Failed to delete some files from S3:",
          s3DeleteResult.failed
        );
        // Don't fail the entire operation, just log the errors
      }

      if (s3DeleteResult.successful.length > 0) {
        console.log(
          `Successfully deleted ${s3DeleteResult.successful.length} files from S3`
        );
      }
    }

    // Finally, delete the event itself
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (deleteError) {
      console.error("Error deleting event:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error in event deletion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
