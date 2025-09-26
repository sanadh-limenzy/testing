"use client";

import type { EventDatabaseWithAllData } from "@/@types/index";
import { Button } from "@/components/ui/button";
import { Edit3, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { meetsMinimumDuration } from "@/lib/time-utils";
import eventUtils from "@/lib/event-utils";
import type { DefendabilityScoreParams } from "@/lib/event-utils";

const getEventStatus = (event: EventDatabaseWithAllData) => {
  if (event.is_draft)
    return {
      label: "Draft",
      color: "text-yellow-600",
    };
  if (event.is_completed_event)
    return {
      label: "Completed",
      color: "text-green-600",
    };
  return {
    label: "Booked",
    color: "text-blue-600",
  };
};

const calculateEventDuration = (event: EventDatabaseWithAllData) => {
  try {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
    return Math.max(1, daysDiff); // Ensure at least 1 day
  } catch {
    return 1; // Default to 1 day if date parsing fails
  }
};

export function EventCard({
  event,
  onDelete,
}: {
  event: EventDatabaseWithAllData;
  onDelete: (event: EventDatabaseWithAllData) => void;
}) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const status = getEventStatus(event);

  // Create defendability score parameters object
  const defendabilityParams: DefendabilityScoreParams = {
    description: event.description || "",
    peopleCount: event.people_count || 0,
    duration: meetsMinimumDuration(event.start_time, event.end_time, 4.5),
    digitalValuation: event.defendability_scores?.digital_valuation || false,
    moneyPaidToPersonnel: event.money_paid_to_personal || false,
    evidenceSupporting: (event.event_documents?.length || 0) > 0,
  };

  const totalDefendabilityScore =
    eventUtils.totalDefendabilityScore(defendabilityParams);
  const maxDefendabilityScore = 5;

  // Calculate progress for circular indicator based on event duration
  const eventDuration = calculateEventDuration(event);
  const maxDuration = 14;
  const eventProgress = Math.min(eventDuration, maxDuration);
  const progressPercentage = (eventProgress / maxDuration) * 100;

  return (
    <div className="bg-gray-100 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between">
        {/* Left Section - Event Details */}
        <div className="flex-1 pr-8">
          {/* Title and Status */}
          <div className="flex items-center mb-3">
            <h3 className="text-xl font-bold text-black mr-2">
              {event.title || "Untitled Event"}
            </h3>
            <span className={`font-normal ${status.color}`}>
              ({status.label})
            </span>
          </div>

          {/* Address */}
          {event.rental_address && (
            <div className="text-gray-600 mb-3 text-base">
              {event.rental_address.street} {event.rental_address.city}{" "}
              {event.rental_address.state} {event.rental_address.zip} US
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-2">
            <div className="text-gray-600 text-base">
              Date of event:{" "}
              <span className="font-bold text-gray-900">
                {formatDate(event.start_date) === formatDate(event.end_date)
                  ? formatDate(event.start_date)
                  : `${formatDate(event.start_date)} - ${formatDate(
                      event.end_date
                    )}`}
              </span>
            </div>
            <div className="text-gray-600 text-base">
              Uploaded photos of event:{" "}
              <span className="font-bold text-green-600">
                {event.thumbnails?.length ? "Yes" : "N/A"}
              </span>
            </div>
            <div className="text-gray-600 text-base">
              Supporting documents added:{" "}
              <span className="font-bold text-red-600">
                {event.event_documents?.length ? "Yes" : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions, Scores and Progress */}
        <div className="flex flex-col items-end space-y-4">
          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              asChild
            >
              <Link
                href={`/subscriber/events/edit/${event.id}`}
                title="Edit Event"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => {
                console.log("Close event:", event.id);
              }}
              title="Close Event"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
              onClick={() => onDelete(event)}
              title="Delete Event"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Defendability Score and Valuation */}
          <div className="text-right">
            <div className="text-gray-600 text-sm mb-1">
              Defendability Score:{" "}
              <span className="font-bold text-yellow-600">
                {totalDefendabilityScore}/{maxDefendabilityScore}
              </span>
            </div>
            <div className="text-gray-600 text-sm">
              Valuation used:{" "}
              <span className="font-bold text-blue-600">
                {event.defendability_scores?.digital_valuation
                  ? "Digital"
                  : "Manual"}{" "}
                valuation
              </span>
            </div>
          </div>

          {/* Circular Progress Indicator */}
          <div className="relative">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="#1f2937"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={
                  2 * Math.PI * 34 -
                  (progressPercentage / 100) * 2 * Math.PI * 34
                }
                strokeLinecap="round"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {eventProgress}/{maxDuration}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
