"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEvent, useEventsFromRentalAddress } from "@/hooks/useEvent";
import { EventForm } from "@/components/events/EventForm";
import { EventFormData } from "@/@types/validation";
import { DefensibilityScore } from "@/@types/event-form";
import { convertTo24HourFormat } from "@/lib/time-utils";
import { useDefaultBusinessAddress } from "@/hooks/useAddress";

export default function ViewEvent() {
  const params = useParams();
  const eventId = params.id as string;

  const { data: eventData, isLoading, error } = useEvent(eventId);
  const {
    data: eventsFromRentalAddressData,
    isLoading: rentalAddressLoading,
    error: rentalAddressError,
  } = useEventsFromRentalAddress(eventData?.data?.rental_address?.id);
  const { data: businessAddressData, isLoading: businessAddressLoading } =
    useDefaultBusinessAddress();

  if (error || rentalAddressError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">
                Failed to load event details:{" "}
                {error?.message || rentalAddressError?.message}
              </p>
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Link href="/subscriber/home">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let initialData:
    | (EventFormData & { defendability_scores: DefensibilityScore })
    | undefined = undefined;

  if (eventData?.data) {
    const defendabilityScores =
      eventData?.data?.defendability_scores.length > 0
        ? eventData?.data?.defendability_scores[0]
        : {
            written_notes: false,
            digital_valuation: false,
            evidence_supporting: false,
            more_people: false,
            money_paid_to_personnel: false,
            more_duration: false,
          };
    initialData = {
      title: eventData?.data?.title,
      start_date: eventData?.data?.start_date,
      end_date: eventData?.data?.end_date,
      start_time: convertTo24HourFormat(eventData?.data?.start_time),
      end_time: convertTo24HourFormat(eventData?.data?.end_time),
      people_count: eventData?.data?.people_count.toString(),
      rental_amount: eventData?.data?.amount.toString(),
      description: eventData?.data?.description,
      money_paid_to_personal:
        eventData?.data?.money_paid_to_personal ||
        defendabilityScores.money_paid_to_personnel,
      residence: eventData?.data?.rental_address_id,
      event_documents: eventData?.data?.event_documents,
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
      excluded_areas: eventData?.data?.excluded_areas,
      thumbnails: eventData?.data?.thumbnails,
      business_address_id: businessAddressData?.id || "",
    };
  }

  return (
    <div className=" bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button and Edit Button */}
        <div className="mb-6 flex items-center justify-between">
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

          <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link href={`/subscriber/events/edit/${eventId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Link>
          </Button>
        </div>

        <EventForm
          mode="view"
          property={eventData?.data?.rental_address}
          eventId={eventId}
          initialData={initialData}
          showSidebar={true}
          isLoading={
            isLoading || rentalAddressLoading || businessAddressLoading
          }
          eventsFromRentalAddress={eventsFromRentalAddressData?.data}
          business_address_id={businessAddressData?.id || ""}
          is_custom_plan={
            eventData?.data?.rental_address?.is_custom_plan || false
          }
        />
      </div>
    </div>
  );
}
