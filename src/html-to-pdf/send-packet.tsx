import { format, differenceInDays } from "date-fns";
import * as converter from "json-2-csv";
import { EventDatabaseWithAllData } from "@/@types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import airdnaUtils, { AirDNAListing, Comp } from "@/lib/airdna-utils";
import { uploadFileToS3 } from "@/lib/s3-utils";
import { pdfService } from "@/lib/pdf-utils";

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "MMM d, yyyy");
};

interface TaxDeductions {
  totalDeduction: number;
  potentialSavings: number;
}

const formatAddressInSingleText = (address: {
  street?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}) => {
  let addressFormat = "";

  if (address?.street) {
    addressFormat = addressFormat.trim() + ` ${address?.street}`;
  }

  if (address?.line1) {
    addressFormat = addressFormat.trim() + ` ${address?.line1}`;
  }

  if (address?.line2) {
    addressFormat = addressFormat.trim() + ` ${address?.line2}`;
  }

  if (address?.city) {
    addressFormat = addressFormat.trim() + ` ${address?.city}`;
  }

  if (address?.state) {
    addressFormat = addressFormat.trim() + ` ${address?.state}`;
  }

  if (address?.zip) {
    addressFormat = addressFormat.trim() + ` ${address?.zip}`;
  }

  if (address?.country) {
    addressFormat = addressFormat.trim() + ` ${address?.country}`;
  }

  return addressFormat;
};

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * @param {number} lat1 Latitude of the first point.
 * @param {number} lon1 Longitude of the first point.
 * @param {number} lat2 Latitude of the second point.
 * @param {number} lon2 Longitude of the second point.
 * @returns {number} The distance in kilometers.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the AirDNA property listing most closely related to the target property.
 * @param targetProperty The property object you want to find matches for.
 * @param airdnaListings An array of AirDNA property listings.
 * @returns {{ bestMatch: AirDNAListing | null, score: number } | null} The AirDNA listing that is most similar, or null if no listings are provided.
 * Returns an object { bestMatch: listing, score: number }
 */
function findClosestProperty(
  targetProperty: {
    country?: string;
    state?: string;
    city?: string;
    zip?: string;
    bedrooms?: number;
    lat?: number;
    lng?: number;
  },
  airdnaListings: AirDNAListing[]
): { bestMatch: AirDNAListing | null; score: number } | null {
  if (!airdnaListings || airdnaListings.length === 0) {
    console.warn("No AirDNA listings provided.");
    return null;
  }

  let bestMatch = null;
  let highestScore = -1;

  const WEIGHTS = {
    ZIP_MATCH: 50,
    CITY_MATCH: 30,
    STATE_MATCH: 20,
    COUNTRY_MATCH: 10,
    BEDROOM_MAX_SCORE: 35,
    DISTANCE_SCORE: 40,
    MAX_RELEVANT_DISTANCE_KM: 100,
  };

  airdnaListings.forEach((airbnbListing) => {
    let currentScore = 0;

    const normalizeCountry = (c: string) =>
      c?.toUpperCase() === "US" ? "United States" : c;

    const targetCountryNormalized = normalizeCountry(
      targetProperty.country || "US"
    );
    const listingCountryNormalized = normalizeCountry(
      airbnbListing.country_name
    );

    if (targetCountryNormalized === listingCountryNormalized) {
      currentScore += WEIGHTS.COUNTRY_MATCH;
    }

    if (targetProperty.state === airbnbListing.state_name) {
      currentScore += WEIGHTS.STATE_MATCH;
    }

    if (targetProperty.city === airbnbListing.city_name) {
      currentScore += WEIGHTS.CITY_MATCH;
    }

    if (targetProperty.zip === airbnbListing.zipcode) {
      currentScore += WEIGHTS.ZIP_MATCH;
    }

    let bedroomScoreContribution = 0;
    if (
      typeof targetProperty.bedrooms === "number" &&
      typeof airbnbListing.bedrooms === "number"
    ) {
      const bedroomDifference = Math.abs(
        targetProperty.bedrooms - airbnbListing.bedrooms
      );

      if (bedroomDifference === 0) {
        bedroomScoreContribution = WEIGHTS.BEDROOM_MAX_SCORE;
      } else if (bedroomDifference === 1) {
        bedroomScoreContribution = WEIGHTS.BEDROOM_MAX_SCORE * 0.65;
      } else if (bedroomDifference === 2) {
        bedroomScoreContribution = WEIGHTS.BEDROOM_MAX_SCORE * 0.25;
      } else {
        bedroomScoreContribution = 0;
      }
    }

    currentScore += bedroomScoreContribution;

    if (
      targetProperty.lat != null &&
      targetProperty.lng != null &&
      airbnbListing.location &&
      airbnbListing.location.lat != null &&
      airbnbListing.location.lng != null
    ) {
      const distance = calculateDistance(
        targetProperty.lat,
        targetProperty.lng,
        airbnbListing.location.lat,
        airbnbListing.location.lng
      );

      if (distance <= WEIGHTS.MAX_RELEVANT_DISTANCE_KM) {
        currentScore +=
          WEIGHTS.DISTANCE_SCORE *
          (1 - distance / WEIGHTS.MAX_RELEVANT_DISTANCE_KM);
      }
    }

    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatch = airbnbListing;
    }
  });

  if (bestMatch) {
    return { bestMatch, score: highestScore };
  }

  return { bestMatch: airdnaListings[0], score: highestScore };
}

type CalculatedTaxDeductions = {
  totalDeduction?: number;
  totalTaxableAmount?: number;
  potentialSavings?: number;
  daysUsed?: number;
  daysRemaining?: number;
};

function calculateTaxDeductions(
  events: EventDatabaseWithAllData[]
): CalculatedTaxDeductions {
  if (!events?.length) return {};

  const moneySaved = events.reduce(
    (acc, event) => acc + (event.amount || 0),
    0
  );

  const totalTaxableAmount = events.reduce(
    (acc, event) => acc + (event.taxable_amount || 0),
    0
  );

  const activitiesLength = events.reduce((totalDays, event) => {
    if (!event.start_date || !event.end_date) return totalDays;
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const eventDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return totalDays + eventDays;
  }, 0);

  const potentialSavings =
    activitiesLength > 0 ? Math.round((moneySaved / activitiesLength) * 14) : 0;

  return {
    totalDeduction: moneySaved,
    totalTaxableAmount,
    potentialSavings,
    daysUsed: activitiesLength,
    daysRemaining: Math.max(0, 14 - activitiesLength),
  };
}

type TaxPacketData = {
  taxYear: number;
  userName: string;
  totalEvents: number;
  taxDeductions: CalculatedTaxDeductions;
  csvLink: string;
  reimbursementPlan: string;
  eventsArray: EventDatabaseWithAllData & { comps_list: Comp[] }[];
  isAlreadyHaveReimbursementPlan: boolean;
};

/**
 * Generate tax packet data
 * @param userId - The user id
 * @param taxYear - The tax year
 * @param events - The events with rental_agreement, rental_address, business_address, defendability_scores, event_documents, daily_amounts, event_invoices
 * @param reimbursementPlan - The reimbursement plan
 * @param isAlreadyHaveReimbursementPlan - Whether the user already has a reimbursement plan
 */
export async function generateTaxPacketData(
  userId: string,
  taxYear: number,
  events: EventDatabaseWithAllData[],
  reimbursementPlan: {
    signatureDocUrl: string;
  },
  isAlreadyHaveReimbursementPlan = false
): Promise<TaxPacketData | undefined> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log("No user for userId:", userId);
    return;
  }

  if (events.length === 0) {
    return;
  }

  const eventsWithComps = await Promise.all(
    events.map(async (event) => {
      if (!event?.rental_address?.zip) {
        console.log("No zipCode for event:", event.id);
        return event;
      }

      try {
        console.log(
          "Fetching comps for zip: ",
          event.rental_address.zip,
          ". event id: ",
          event.id
        );

        if (event.defendability_scores.digital_valuation === false) {
          return event;
        }

        const { data: marketCode, error: marketCodeError } = await supabase
          .from("market_codes")
          .select("*")
          .eq("zip", event.rental_address.zip)
          .limit(1)
          .single();

        if (marketCodeError) {
          console.log("No marketCode for event:", event.id);
          return event;
        }

        if (!marketCode) {
          console.log("No marketCode for event:", event.id);
          return event;
        }

        const allAirDnaListings =
          await airdnaUtils.fetchListingsWithHighAvailabilityAndSuperhost({
            marketId: marketCode.city_id,
            offset: 0,
            pageSize: 10,
          });

        if (!allAirDnaListings || allAirDnaListings.isError) {
          console.log("No allAirDnaListings for event:", event.id);
          return event;
        }

        const closestPropertyResult = findClosestProperty(
          event?.rental_address,
          allAirDnaListings.data
        );

        if (!closestPropertyResult || !closestPropertyResult.bestMatch) {
          console.log("No closestPropertyResult for event:", event.id);
          return event;
        }

        const comps = await airdnaUtils.fetchCompsListNew({
          listingId: closestPropertyResult.bestMatch.property_id,
        });

        if (comps?.isError) {
          console.warn(
            "No properties in comps response for zip:",
            event.rental_address.zip
          );
          return event;
        }
        return {
          ...event,
          comps_list: comps.data,
        };
      } catch (err) {
        console.log(err);
      }
    })
  );

  const taxCalculations = calculateTaxDeductions(events);

  // Calculate total days across all events
  const totalDays = events.reduce((total, event) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    // Calculate difference in days (including both start and end days)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return total + diffDays;
  }, 0);

  const packetData = {
    taxYear,
    userName: `${user?.user_metadata.first_name} ${user?.user_metadata.last_name}`,
    totalEvents: totalDays,
    taxDeductions: taxCalculations,
    csvLink: null,
    reimbursementPlan: reimbursementPlan?.signatureDocUrl || null,
    eventsArray: eventsWithComps,
    isAlreadyHaveReimbursementPlan,
  };

  return packetData;
}

export async function createTaxPacketPDF(
  packetData: TaxPacketData,
  events: EventDatabaseWithAllData[],
  selectedYear: number | string,
  saveData: {
    _events: string[];
    amount: number;
    packetId: string;
    eventsCsvLink: string;
    pdfPath: string;
    reimbursementPlan: string;
  }
) {
  try {
    const eventFilteredByRental: { [key: string]: EventDatabaseWithAllData[] } =
      {};
    const eventsArray: {
      "Event #": string;
      Residence: string;
      "Corporate Event": string;
      Description: string;
      "Start Time": string;
      "End Time": string;
      Duration: string;
      Amount: string;
      "Taxable Amount": string;
      "Add To My Calendar": string;
      Thumbnails: string;
      "Number of people attending": string;
      "Areas not included": string;
      "Defendability Score": string;
      Invoice: string;
      Documents: string;
    }[] = [];

    saveData._events = saveData._events || [];
    saveData.amount = saveData.amount || 0;

    events.forEach((each) => {
      const rentalId = String(each.rental_address.id);
      if (!eventFilteredByRental[rentalId]) {
        eventFilteredByRental[rentalId] = [];
      }
      eventFilteredByRental[rentalId].push(each);
    });

    Object.keys(eventFilteredByRental).forEach((key) => {
      eventFilteredByRental[key].forEach((each, index) => {
        saveData._events.push(each.id);
        saveData.amount += each.amount;
        const documentLinks = (each.event_documents || [])
          .map((doc) => doc.url)
          .join(", ");

        const defendabilityScore = {
          writtenNotes: each.defendability_scores?.written_notes || false,
          digitalValuation:
            each.defendability_scores?.digital_valuation || false,
          evidenceSupporting:
            each.defendability_scores?.evidence_supporting || false,
          morePeople: each.defendability_scores?.more_people || false,
        };

        const total = Object.keys(defendabilityScore).length;
        const score = Object.values(defendabilityScore).filter(Boolean).length;

        eventsArray.push({
          "Event #": String(index + 1),
          Residence: formatAddressInSingleText(each.rental_address),
          "Corporate Event": each.title.toUpperCase(),
          Description: each.description,
          "Start Time": each.start_time,
          "End Time": each.end_time,
          Duration: each.duration.toString(),
          Amount: String(each.amount || 0),
          "Taxable Amount": String(each.taxable_amount || 0),
          "Add To My Calendar": each.add_to_my_calendar ? "Yes" : "No",
          Thumbnails: each.thumbnails.join(",") || "-",
          "Number of people attending": each.people_count.toString() || "-",
          "Areas not included": each.excluded_areas || "-",
          "Defendability Score": `${score}/${total}`,
          Invoice: each.event_invoices?.url || "-",
          Documents: documentLinks || "-",
        });
      });

      eventsArray.push({
        "Event #": "",
        Residence: "",
        "Corporate Event": "",
        Description: "",
        "Start Time": "",
        "End Time": "",
        Duration: "",
        Amount: "",
        "Taxable Amount": "",
        "Add To My Calendar": "",
        Thumbnails: "",
        "Number of people attending": "",
        "Areas not included": "",
        "Defendability Score": "",
        Invoice: "",
        Documents: "",
      });
    });

    const csvString = await converter.json2csv(eventsArray);
    const base64Buffer = Buffer.from(csvString);
    const uploadDetails = await uploadFileToS3(
      base64Buffer,
      `events_${selectedYear}_${saveData.packetId}.csv`,
      events[0].created_by,
      {
        filename: `events_${selectedYear}_${saveData.packetId}.csv`,
        contentType: "text/csv",
      }
    );

    if (!uploadDetails.success || !uploadDetails.url) {
      console.log("Failed to upload CSV file");
      return {
        success: false,
        data: null,
        error: "Failed to upload CSV file",
      };
    }

    const csvLink = uploadDetails.url;

    packetData.csvLink = csvLink;
    saveData.eventsCsvLink = csvLink;

    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n");
    console.dir(Object.keys(packetData.eventsArray?.[0]), { depth: null });
    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n");

    const html = sendPacketToHtml(
      packetData.userName,
      packetData.taxYear,
      packetData.totalEvents,
      packetData.taxDeductions,
      csvLink,
      [],
      packetData.eventsArray,
      saveData.reimbursementPlan
    );

    const pdf = await pdfService.generatePDF(html, {
      filename: `${packetData.taxYear}_${packetData.userName}.pdf`,
    });
    const pdfUploadDetails = await uploadFileToS3(
      pdf.buffer,
      `${packetData.taxYear}_${packetData.userName}.pdf`,
      events[0].created_by,
      {
        filename: `${packetData.taxYear}_${packetData.userName}.pdf`,
        contentType: "application/pdf",
      }
    );
    saveData.pdfPath = pdfUploadDetails.url || "";

    return {
      success: true,
      data: {
        pdfPath: pdfUploadDetails.url,
        csvLink,
        eventsArray,
      },
      error: null,
    };
  } catch (error) {
    console.log("Failed to create PDF", error);
    return {
      success: false,
      data: null,
      error: String(
        error instanceof Error ? error.message : "Something went wrong"
      ),
    };
  }
}

export const sendPacketToHtml = (
  userName: string,
  taxYear: number | string,
  totalEvents: number,
  taxDeductions: TaxDeductions,
  csvLink: string,
  documents: Document[],
  eventsArray: (EventDatabaseWithAllData & { comps_list: Comp[] })[],
  reimbursementPlan: string
) => {
  const { totalDeduction, potentialSavings } = taxDeductions;

  const calculateDuration = (
    startTimeStr: string,
    endTimeStr: string,
    startDate: string,
    endDate: string
  ) => {
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");

      let hours24 = parseInt(hours);

      // Handle 12-hour format (AM/PM) if period exists
      if (period) {
        if (period.toLowerCase() === "pm" && hours24 < 12) {
          hours24 += 12;
        } else if (period.toLowerCase() === "am" && hours24 === 12) {
          hours24 = 0;
        }
      }
      // If no period, assume it's already in 24-hour format

      return hours24 * 60 + parseInt(minutes); // Convert to total minutes
    };

    // Calculate daily duration
    const startMinutes = parseTime(startTimeStr);
    const endMinutes = parseTime(endTimeStr);
    const dailyDurationMinutes = endMinutes - startMinutes;

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = differenceInDays(end, start) + 1; // +1 to include both start and end days

    // Total duration in hours
    const totalDurationHours = (dailyDurationMinutes * daysDiff) / 60;

    return totalDurationHours.toFixed(1); // Return with 1 decimal place
  };

  console.log("reimbursementPlan: ", reimbursementPlan);    

  // Generate events table rows
  const generateEventsTableRows = (
    events: {
      start_time: string;
      end_time: string;
      start_date: string;
      end_date: string;
      title: string;
      amount: number;
    }[]
  ) => {
    let rows = "";

    // Add existing events
    events.forEach((event, index: number) => {
      const duration = calculateDuration(
        event.start_time,
        event.end_time,
        event.start_date,
        event.end_date
      );
      const eventId = `event-${index + 1}`;
      rows += `
        <tr>
          <td class="font-medium">
            <a href="#${eventId}" class="event-link" style="color: #2563EB; text-decoration: underline; cursor: pointer;">
              ${event.title}
            </a>
          </td>
          <td>${formatDate(event.start_date)} to ${formatDate(
        event.end_date
      )}</td>
          <td>${duration} hours</td>
          <td class="text-right">$${event.amount}</td>
        </tr>
      `;
    });

    return rows;
  };

  // Generate event details
  const generateEventDetails = (event: EventDatabaseWithAllData) => {
    const duration = calculateDuration(
      event.start_time,
      event.end_time,
      event.start_date,
      event.end_date
    );
    const formattedDates =
      event.start_date === event.end_date
        ? formatDate(event.start_date)
        : `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`;

    return `
        <div class="event-details">
          <h2>Event: "${event.title}"</h2>

          <h3>Description</h3>
          <p class="description">${event.description || ""}</p>

          <h3>Number of People Attending: ${event.people_count}</h3>
          <div class="attendees">
            ${
              event.people_names
                ? event.people_names
                    .map((name, i) => `<p>Attendee #${i + 1}: ${name}</p>`)
                    .join("")
                : ""
            }
          </div>
          <h3>Areas Not Included In Event Rental</h3>
          <ul class="excluded-areas">
            ${
              event.excluded_areas
                ? event.excluded_areas
                    .split(",")
                    .map((area) => `<li>${area}</li>`)
                    .join("")
                : ""
            }
          </ul>

          <h3>Date of Event: ${formattedDates}</h3>
          <p>Start time: ${event.start_time}</p>
          <p>End time: ${event.end_time}</p>
          <p>Total meeting time: ${duration} hrs</p>

          <h3>Rental Amount</h3>
          <p>$${event.amount} USD</p>

           <div class="page-break document-card">
              <div class="card">
                  <h2 class="text-2xl font-bold mb-4">Rental Agreement Document</h2>
                  
                    <a 
                    href="${event.rental_agreement?.signature_doc_url || "#"}" 
                    class="btn btn-outline btn-blue" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style="border: 2px solid #2563EB; color: #2563EB; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;"
                  >
                  View Full Document
                </a>
                  
              </div>

               ${
                 event.defendability_scores?.money_paid_to_personnel
                   ? `
                  <div class="card">
                      <h2 class="text-2xl font-bold mb-4">PAID Invoice</h2>
                      
                        <a 
                        href="${event.event_invoices?.url}" 
                        class="btn btn-outline btn-blue" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style="border: 2px solid #2563EB; color: #2563EB; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;"
                      >
                      View Full Document
                    </a>
                      
                  </div>
               `
                   : ""
               }
            </div>
        </div>
      `;
  };

  // Generate images gallery
  const generateImagesGallery = (event: EventDatabaseWithAllData) => {
    return `
      <div class="image-gallery card">
        <h2 class="text-2xl font-bold mb-4">Photos uploaded</h2>
        <div class="gallery-grid">
        ${event?.thumbnails?.map(
          (thumbnail) =>
            `<div class="gallery-item">
              <img src="${thumbnail}" alt="Event image" />
            </div>`
        )}
            
        </div>
      </div>
    `;
  };

  // Generate documents gallery
  const generateDocumentsGallery = (event: EventDatabaseWithAllData) => {
    if (!event?.event_documents || event.event_documents.length === 0)
      return "";

    return ` 
      <div class="document-gallery card">
        <h2 class="text-2xl font-bold mb-4">Supporting Documents</h2>
        <div class="document-grid">
          ${event?.event_documents
            ?.map((doc) => {
              const isImage = doc.url?.match(/\.(jpg|jpeg|png|gif)$/i);
              return `
              <div class="document-item">
                <div class="document-image-container">
                  ${
                    isImage
                      ? `<img src="${doc.url}" alt="${
                          doc.title || "Document preview"
                        }" />`
                      : `<div class="w-full h-32 flex items-center justify-center bg-gray-100 border rounded">
                        <span class="text-3xl">${getFileIcon(
                          doc.url || ""
                        )}</span>
                      </div>`
                  }
                </div>
                <div class="document-info">
                  <h4>${doc.title || "Document"}</h4>
                  <p>${doc.description || ""}</p>
                  <a href="${
                    doc.url
                  }" target="_blank" class="text-xs text-blue-500 hover:underline">
                    ${doc.url ? doc.url.split("/").pop() : "View Document"}
                  </a>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  };

  // Generate comparables section
  const generateComparables = (
    event: EventDatabaseWithAllData & { comps_list: Comp[] }
  ) => {
    // Skip generating comparables if this is a manual valuation
    const hasDocuments = event?.event_documents?.length > 0;
    const hasComps = event?.comps_list?.length > 0;
    if (
      !event.defendability_scores?.digital_valuation ||
      (hasDocuments && !hasComps)
    )
      return "";

    const comparables = event.comps_list;
    if (!comparables || comparables.length === 0) return "";

    // Split comparables into groups of 6
    const compsGroups = [];
    for (let i = 0; i < comparables.length; i += 6) {
      compsGroups.push(comparables.slice(i, i + 6));
    }

    return `
      <div class="card">
        <h3 class="text-xl font-bold mb-4">Comparables for Event on ${formatDate(
          event.start_date
        )} to ${formatDate(event.end_date)}</h3>
        ${compsGroups
          .map(
            (group, index) => `
          <div class="comparables-grid" style="${
            index > 0 ? "padding-top: 10rem;" : ""
          }">
            ${group
              .map(
                (comp) => `
              <div class="property-card">
                <div class="property-header">
                  <h4 class="font-bold">${comp.details.title}</h4>
                </div>
                <div class="property-body">
                  <div class="grid-3-cols">
                    <div>
                      <p class="text-sm text-gray-500">Bedrooms</p>
                      <p class="text-sm">${comp.details.bedrooms}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">Bathrooms</p>
                      <p class="text-sm">${comp.details.bathrooms}</p>
                    </div>
                  </div>
                  <div class="flex justify-between items-center border-t">
                    <span class="text-sm text-gray-500">Rental Amount</span>
                    <span class="font-bold">$${comp.metrics.adr}</span>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  };

  const generateCompsForManualValuation = (event: EventDatabaseWithAllData) => {
    return `
      <div class="manual-valuation">
        <h4 class="text-lg font-bold mb-2">Rental Amount: $${event.amount}</h4>
        
        ${
          event.event_documents?.length > 0
            ? `
          <div class="document-gallery mt-4">
            <h5 class="font-medium mb-2">Supporting Documents</h5>
            <div class="grid grid-cols-3 gap-4">
              ${event.event_documents
                .map((doc) => {
                  const isImage = doc.url?.match(/\.(jpg|jpeg|png|gif)$/i);
                  return `
                  <div class="document-item">
                    ${
                      isImage
                        ? `<img src="${doc.url}" alt="Document preview" class="w-full h-32 object-contain border rounded" />`
                        : `<div class="w-full h-32 flex items-center justify-center bg-gray-100 border rounded">
                          <span class="text-3xl">${getFileIcon(
                            doc.url || ""
                          )}</span>
                        </div>`
                    }
                    <div class="mt-1 text-center">
                      <a href="${
                        doc.url
                      }" target="_blank" class="text-xs text-blue-500 hover:underline">
                        ${doc.url ? doc.url.split("/").pop() : "View Document"}
                      </a>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  };

  const getFileIcon = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      default:
        return "📁";
    }
  };

  // Generate event section
  const generateEventSection = (
    event: EventDatabaseWithAllData & { comps_list: Comp[] },
    index: number,
    isLast: boolean
  ) => {
    // Determine if this is a manual valuation by checking if documents exist but no comps
    const hasDocuments = event?.event_documents?.length > 0;
    const hasComps = event?.comps_list?.length > 0;
    const isManualValuation = hasDocuments;

    // Log for debugging
    console.log(
      `Event ID: ${event.id}, hasDocuments: ${hasDocuments}, hasComps: ${hasComps}, isManualValuation: ${isManualValuation}`
    );

    const eventId = `event-${index + 1}`;

    return `
      <!-- Event Details Section -->
    <div class="page-break" id="${eventId}">
        ${generateEventDetails(event)}
    </div>

    <!-- Images Section -->
    ${
      event?.thumbnails
        ? `
    <div class="page-break">
      ${generateImagesGallery(event)}
    </div>
    `
        : ""
    }

    <!-- Documents Section -->
    ${
      event?.event_documents?.length > 0 && !isManualValuation
        ? `
    <div class="page-break">
      ${generateDocumentsGallery(event)}
    </div>
    `
        : ""
    }

    <!-- Comparables Section -->
    <section class="print-pb-4 ${isLast ? "" : "page-break"}">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">${
          isManualValuation ? "Manual Valuation" : "Comparables"
        }</h2>
      </div>

      ${
        isManualValuation
          ? generateCompsForManualValuation(event)
          : generateComparables(event)
      }
    </section>

    <!-- Accountable Plan Images Section -->

    `;
  };

  // Calculate events ratio and circle dash array
  const eventsRatio = `${totalEvents}/14`;
  const eventsCircleDashArray = `${(totalEvents / 14) * 100}, 100`;
  const eventsMessage = `Held ${totalEvents} events so far this year.`;

  // Calculate tax deduction progress percentage
  const deductionProgressPercentage = Math.min(
    (totalDeduction / potentialSavings) * 100,
    100
  );

  // Return the complete HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${taxYear} The Augusta Rule Tax Packet</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: #000;
      background-color: #fff;
      min-height: 100vh;
      line-height: 1.5;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    /* Header */
    header {
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: white;
    }

    header .container {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
    }

    header p {
      color: #6b7280;
    }

    /* Button and link styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-weight: 500;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s, border-color 0.2s;
      text-decoration: none;
      color: #2563EB;
    }

    /* PDF-specific link styles */
    a {
      color: #2563EB !important;
      text-decoration: underline !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    a[target="_blank"] {
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    /* Event link styles for table of contents */
    .event-link {
      color: #2563EB !important;
      text-decoration: underline !important;
      cursor: pointer !important;
      transition: color 0.2s ease;
    }

    .event-link:hover {
      color: #1d4ed8 !important;
    }

    /* Table of contents header */
    .bg-blue-50 {
      background-color: #eff6ff;
    }

    .border-blue-200 {
      border-color: #bfdbfe;
    }

    .text-blue-800 {
      color: #1e40af;
    }

    .p-3 {
      padding: 0.75rem;
    }

    .rounded {
      border-radius: 0.375rem;
    }



    /* Ensure anchor links work in PDF */
    [id] {
      scroll-margin-top: 20px;
    }

    .btn-outline {
      background-color: transparent;
      border: 1px solid #e5e7eb;
      color: #000;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .btn-blue {
      border-color: #1e40af;
      color: #1e40af;
    }

    /* Main content */
    main {
      padding: 1.5rem 1rem;
    }

    .space-y-12 > * + * {
      margin-top: 3rem;
    }

    /* Cover page */
    .cover-page {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }

    .text-center {
      text-align: center;
    }

    .max-w-2xl {
      max-width: 42rem;
      margin-left: auto;
      margin-right: auto;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    .mb-6 {
      margin-bottom: 1.5rem;
    }

    .mb-8 {
      margin-bottom: 2rem;
    }

    .text-3xl {
      font-size: 1.875rem;
    }

    .text-2xl {
      font-size: 1.5rem;
    }

    .text-xl {
      font-size: 1.25rem;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .text-gray-600 {
      color: #4b5563;
    }

    .text-gray-400 {
      color: #9ca3af;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .flex {
      display: flex;
    }

    .justify-center {
      justify-content: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .items-center {
      align-items: center;
    }

    .items-start {
      align-items: flex-start;
    }

    .gap-8 {
      gap: 2rem;
    }

    .gap-1 {
      gap: 0.25rem;
    }

    /* Card styles */
    .card {
      background-color: #f9fafb;
      padding: 1.5rem;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
      margin-bottom: 2rem;
    }

    .space-y-8 > * + * {
      margin-top: 2rem;
    }

    /* Progress bar */
    .progress-container {
      width: 100%;
      height: 8px;
      background-color: #E5E7EB;
      border-radius: 4px;
      overflow: hidden;
      margin: 0.5rem 0;
    }

    .progress-bar {
      height: 100%;
      background-color: #4F46E5;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.75rem;
      font-weight: 500;
      background-color: #f3f4f6;
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .text-right {
      text-align: right;
    }

    .font-medium {
      font-weight: 500;
    }

    /* Property cards */
    .property-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background-color: white;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .property-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .property-body {
      padding: 1rem;
    }

    .grid-3-cols {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .border-t {
      border-top: 1px solid #f3f4f6;
      padding-top: 0.5rem;
    }

    /* Circle chart */
    .circle-chart-container {
      position: relative;
      width: 4rem;
      height: 4rem;
    }

    .circle-chart-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e40af;
      font-weight: 700;
    }

    /* Icons */
    .icon {
      display: inline-block;
      vertical-align: middle;
    }

    .ml-1 {
      margin-left: 0.25rem;
    }

    /* Event details */
    .event-details {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .event-details h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #1e40af;
    }

    .event-details h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 1.5rem 0 0.5rem;
      color: #4b5563;
    }

    .event-details .document-card {
      margin:  1.5rem 0 0.5rem;
    }

    .description {
      color: #4b5563;
      line-height: 1.6;
    }

    .attendees p {
      margin: 0.25rem 0;
      color: #4b5563;
    }

    .excluded-areas {
      list-style-type: disc;
      padding-left: 1.5rem;
      margin: 0.5rem 0;
    }

    .excluded-areas li {
      margin: 0.25rem 0;
      color: #4b5563;
    }

    /* Image gallery */
    .image-gallery {
      margin-top: 2rem;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .gallery-item {
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      overflow: hidden;
      aspect-ratio: 4/3;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Document gallery */
    .document-gallery {
      margin-top: 2rem;
    }

    .document-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      place-items: left;
    }

    .document-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .document-image-container {
      width: 100%;
      aspect-ratio: 4/3;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .document-image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .document-link {
      color: #1e40af;
      text-decoration: underline;
      font-size: 0.875rem;
    }

    /* Comparables section */
    .comparables-section {
      margin-top: 2rem;
    }

    .event-comparables {
      margin-bottom: 2rem;
    }

    .event-comparables h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #1e40af;
    }

    .comparables-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    /* Accountable plan */
    .accountable-plan-section {
      margin-top: 2rem;
    }

    .accountable-plan-page {
      margin-bottom: 1.5rem;
    }

    .page-number {
      text-align: center;
      color: #6b7280;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .accountable-plan-image {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* Print styles */
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      
      body {
        font-size: 12pt;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .print-pb-4 {
        padding-bottom: 1rem;
      }
      
      .space-y-12 > * + * {
        margin-top: 2rem;
      }
      
      header {
        position: static !important;
        display: none;
      }
      .text-capitalize {
        text-transform: capitalize;
      }
    }

    /* Responsive */
    @media (min-width: 768px) {
      .container {
        padding: 0 1.5rem;
      }
    }

    /* Persistent clickable footer */
    .pdf-footer {
      position: fixed;
      bottom: 15px;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 12px;
      color: #2563EB;
      z-index: 999;
    }

    .pdf-footer a {
      color: #2563EB !important;
      text-decoration: underline !important;
      cursor: pointer !important;
      font-weight: bold !important;
    }

  </style>
</head>
<body>
  <!-- Header with Print Button -->
  <header>
    <div class="container">
      <div>
        <h1>${taxYear} The Augusta Rule Tax Packet</h1>
        <p class="text-capitalize">${userName} | Section 280A(g)</p>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main id="top" class="container space-y-12">
    <!-- Cover Page / Summary -->
    <div class="cover-page page-break">
      <div class="max-w-2xl text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">${taxYear} The Augusta Rule Tax Packet</h1>
        <p class="text-xl mb-4 text-capitalize">${userName}</p>
        <p class="text-gray-600 mb-2">Section 280A(g) otherwise known as "The Augusta Rule"</p>
        <p class="text-gray-600 mb-6">All details are included in subsequent pages.</p>

        <div class="flex justify-center gap-8 mb-6">
          <div class="text-center">
            <p class="text-sm text-gray-500">Total events in ${taxYear} tax year</p>
            <p class="text-2xl font-bold">${totalEvents}</p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500">Total tax deduction</p>
            <p class="text-2xl font-bold">$${totalDeduction} USD</p>
          </div>
        </div>

        <a 
          href="${csvLink}" 
          class="btn btn-outline btn-blue" 
          target="_blank" 
          rel="noopener noreferrer" 
          style="border: 2px solid #2563EB; color: #2563EB; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;"
        >
          View CSV format
        </a>
      </div>

      <!-- Overview Section -->
      <section class="space-y-8">
        <!-- Tax Deductions Section -->
         <!-- <div class="card">
          <h2 class="text-2xl font-bold mb-4">TAX DEDUCTIONS</h2>
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">$${totalDeduction}</span>
            <span class="font-medium">$${potentialSavings}</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${deductionProgressPercentage}%;"></div>
          </div>
          <div class="flex justify-between text-sm text-gray-600">
            <span>Money saved</span>
            <span>Potential Savings</span>
          </div>
          <p class="text-sm text-gray-500 mt-4">*Calculated on the average rental rate of your past events</p>
        </div> -->

        <!-- Events Section -->
        <div class="card">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold flex items-center">
              EVENTS
              <svg class="icon ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </h2>
            <div class="circle-chart-container">
              <div class="circle-chart-text">${eventsRatio}</div>
              <svg width="100%" height="100%" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E6E6E6"
                  stroke-width="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1E40AF"
                  stroke-width="3"
                  stroke-dasharray="${eventsCircleDashArray}"
                />
              </svg>
            </div>
          </div>
          <p class="text-gray-600 mb-4">
            ${eventsMessage}
          </p>

          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Duration</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${generateEventsTableRows(eventsArray)}
            </tbody>
          </table>
        </div>

        <!-- Accountable Plan Document -->
        <div class="card">
          <h2 class="text-2xl font-bold mb-4">ACCOUNTABLE PLAN DOCUMENT</h2>
            <a 
            href="${reimbursementPlan}" 
            class="btn btn-outline btn-blue" 
            target="_blank" 
            rel="noopener noreferrer" 
            style="border: 2px solid #2563EB; color: #2563EB; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;"
          >
         Download Document
        </a>
        </div>
      </section>
    </div>

    ${eventsArray
      .map((event, index) => {
        const isLast = index === eventsArray.length - 1;
        return generateEventSection(event, index, isLast);
      })
      .join("")}
    
  </main>
  <!-- Fixed Footer with Clickable Link -->
    <div class="pdf-footer">
      <a href="#top" target="_blank">
        Back to Top
      </a>
    </div>

</body>
</html>`;
};
