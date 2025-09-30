import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { EventFormData } from "@/@types/validation";
import { convertTo24HourFormat } from "@/lib/time-utils";
import { DefensibilityScore } from "@/@types/event-form";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to get the base URL for server-side fetching
function getBaseUrl() {
  // In production, use the actual domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // In development, use localhost
  return "http://localhost:3000";
}

// Server-side data fetching functions
async function fetchEvent(eventId: string) {
  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/events/${eventId}`, {
      headers: { cookie },
      cache: "no-cache",
    });

    if (!response.ok) {
      console.error("Failed to fetch event:", response.status);
      return null;
    }

    const result = await response.json();
    return result.success && result.data ? result.data : null;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

async function fetchBusinessAddress() {
  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/subscriber/address/business/default`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch business address:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching business address:", error);
    return null;
  }
}

async function fetchEventsFromRentalAddress(rentalAddressId: string | undefined) {
  if (!rentalAddressId) return [];

  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/events/rental/${rentalAddressId}`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch events from rental address:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching events from rental address:", error);
    return [];
  }
}

export default async function EditEvent({ params }: PageProps) {
  const { id: eventId } = await params;

  // Fetch event data first
  const eventData = await fetchEvent(eventId);

  // If event not found, show error
  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">
                Failed to load event details. Event not found or access denied.
              </p>
              <Link href="/subscriber/home">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch remaining data in parallel
  const [businessAddressData, eventsFromRentalAddressData] = await Promise.all([
    fetchBusinessAddress(),
    fetchEventsFromRentalAddress(eventData.rental_address?.id),
  ]);

  // Prepare initial data for the form
  const defendabilityScores = eventData.defendability_scores || {
    written_notes: false,
    digital_valuation: false,
    evidence_supporting: false,
    more_people: false,
    money_paid_to_personnel: false,
    more_duration: false,
  };

  const initialData: EventFormData & { defendability_scores: DefensibilityScore } = {
    title: eventData.title,
    start_date: eventData.start_date,
    end_date: eventData.end_date,
    start_time: convertTo24HourFormat(eventData.start_time),
    end_time: convertTo24HourFormat(eventData.end_time),
    people_count: eventData.people_count.toString(),
    rental_amount: eventData.amount.toString(),
    description: eventData.description,
    money_paid_to_personal:
      eventData.money_paid_to_personal ||
      defendabilityScores.money_paid_to_personnel,
    residence: eventData.rental_address_id,
    event_documents: eventData.event_documents,
    manual_valuation:
      !defendabilityScores.digital_valuation ||
      defendabilityScores.evidence_supporting,
    defendability_scores: {
      digitalValuation: defendabilityScores.digital_valuation,
      morePeople: defendabilityScores.more_people,
      moreDuration: defendabilityScores.more_duration,
      moneyPaidToPersonnel: defendabilityScores.money_paid_to_personnel,
      writtenNotes: defendabilityScores.written_notes,
      evidenceSupporting: defendabilityScores.evidence_supporting,
    },
    excluded_areas: eventData.excluded_areas,
    thumbnails: eventData.thumbnails,
    people_names: Array.from(
      { length: eventData.people_count },
      (_, index) => ({ name: eventData.people_names?.[index] || "" })
    ),
    daily_amounts: eventData.daily_amounts,
    business_address_id: eventData.business_address_id,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            asChild
          >
            <Link href="/subscriber/home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <EventForm
          initialData={initialData}
          mode="edit"
          isLoading={false}
          property={eventData.rental_address}
          eventId={eventId}
          eventsFromRentalAddress={eventsFromRentalAddressData}
          business_address_id={businessAddressData?.id || ""}
          datePrices={[]}
          is_custom_plan={eventData.rental_address?.is_custom_plan || false}
        />
      </div>
    </div>
  );
}