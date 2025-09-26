"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDeleteEvent, useEventsPerRentalAddress } from "@/hooks/useEvent";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  HistoryPageSkeleton,
  EventsSkeleton,
} from "@/components/skeletons/HistoryPageSkeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  History,
  Calendar,
  MapPin,
  Edit3,
  Trash2,
  Copy,
  Clock,
  Users,
  FileImage,
  FileText,
  TrendingUp,
  Building,
  Eye,
} from "lucide-react";
import { EventDatabaseWithAllData } from "@/@types/index";
import { format } from "date-fns";
import eventUtils, { DefendabilityScoreParams } from "@/lib/event-utils";
import { meetsMinimumDuration } from "@/lib/time-utils";
import Link from "next/link";
import { RentalPropertiesResponse } from "@/hooks/useAddress";

export default function SubscriberHistory() {
  const [selectedResidence, setSelectedResidence] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] =
    useState<EventDatabaseWithAllData | null>(null);

  // Use the existing delete mutation hook
  const deleteEventMutation = useDeleteEvent();

  // Fetch rental properties for the select dropdown
  const {
    data: rentalPropertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError,
  } = useQuery<RentalPropertiesResponse>({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const response = await fetch("/api/subscriber/address/rental");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rental properties");
      }
      return response.json();
    },
  });

  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useEventsPerRentalAddress(selectedResidence);

  const rentalProperties = rentalPropertiesData?.data || [];
  const events = eventsData?.data || [];

  // Delete event function using mutation
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventMutation.mutateAsync(eventToDelete.id);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const openDeleteDialog = (event: EventDatabaseWithAllData) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  if (isLoadingProperties) {
    return <HistoryPageSkeleton />;
  }

  if (propertiesError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">
                Failed to load rental properties: {propertiesError.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <History className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Event History
              </h1>
              <p className="text-gray-600 text-lg">
                Track and manage your rental property events with detailed
                insights
              </p>
              {rentalProperties.length > 0 && (
                <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {rentalProperties.length} Properties
                    </span>
                  </div>
                  {selectedResidence && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {events.length} Events
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Property Selector */}
        <Card className="shadow-sm border-gray-100">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <label className="text-sm font-semibold text-gray-700">
                    Select Rental Property
                  </label>
                </div>
                <Select
                  value={selectedResidence}
                  onValueChange={setSelectedResidence}
                >
                  <SelectTrigger className="w-full h-12 text-left border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Choose a property to view events" />
                  </SelectTrigger>
                  <SelectContent>
                    {rentalProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">
                            {property.nickname ||
                              `${property.street}, ${property.city}`}
                          </span>
                          <span className="text-sm text-gray-500">
                            {property.nickname
                              ? `${property.street}, ${property.city}, ${property.state} ${property.zip}`
                              : `${property.state} ${property.zip}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedResidence && events.length > 0 && (
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    {events.length} event{events.length !== 1 ? "s" : ""} found
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Events Display */}
        {selectedResidence && (
          <>
            {isLoadingEvents ? (
              <EventsSkeleton />
            ) : eventsError ? (
              <Card className="shadow-sm border-gray-100">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-red-500 text-2xl">⚠️</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Failed to Load Events
                  </h3>
                  <p className="text-gray-600 mb-6">{eventsError.message}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Retry Loading
                  </Button>
                </div>
              </Card>
            ) : events.length === 0 ? (
              <Card className="shadow-sm border-gray-100">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Events Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This rental property doesn&apos;t have any events yet.
                    Create your first event to get started.
                  </p>
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Link href="/subscriber/events/create">
                      Create First Event
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    eventIndex={index}
                    onDelete={openDeleteDialog}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* No Property Selected State */}
        {!selectedResidence && rentalProperties.length > 0 && (
          <Card className="shadow-sm border-gray-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Property
              </h3>
              <p className="text-gray-600">
                Choose a rental property from the dropdown above to view its
                event history and insights.
              </p>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Event"
          description="Are you sure you want to delete this event?"
          note="You will not recover this event. All associated data including invoices, documents, images, and rental agreement PDFs will be permanently deleted."
          confirmText="Delete Event"
          cancelText="Cancel"
          onConfirm={handleDeleteEvent}
          variant="destructive"
          isLoading={deleteEventMutation.isPending}
        />
      </div>
    </div>
  );
}

// Enhanced Event Card Component
function EventCard({
  event,
  eventIndex,
  onDelete,
}: {
  event: EventDatabaseWithAllData;
  eventIndex?: number;
  onDelete: (event: EventDatabaseWithAllData) => void;
}) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  const getEventStatus = () => {
    if (event.is_draft)
      return {
        label: "Draft",
        variant: "secondary" as const,
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    if (event.is_completed_event)
      return {
        label: "Completed",
        variant: "default" as const,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    return {
      label: "Pending",
      variant: "outline" as const,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    };
  };

  const status = getEventStatus();

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

  // Calculate progress for circular indicator
  const eventProgress = eventIndex !== undefined ? eventIndex + 1 : 1;
  const maxEvents = 14;
  const progressPercentage = (eventProgress / maxEvents) * 100;
  const circumference = 2 * Math.PI * 28; // radius = 28
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <Card className="shadow-sm border-gray-100 hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Section - Event Details */}
          <div className="flex-1 space-y-4">
            {/* Title, Status, and Actions Row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                  {event.title || "Untitled Event"}
                </h3>
                <Badge
                  variant={status.variant}
                  className={`${status.bgColor} ${status.color} ${status.borderColor} border font-medium`}
                >
                  {status.label}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  asChild
                >
                  <Link
                    href={`/subscriber/events/view/${event.id}`}
                    title="View Event"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    console.log("Duplicate event:", event.id);
                  }}
                  title="Duplicate Event"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(event)}
                  title="Delete Event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Address */}
            {event.rental_address && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm">
                  {event.rental_address.street}, {event.rental_address.city},{" "}
                  {event.rental_address.state} {event.rental_address.zip}
                </p>
              </div>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date & Time */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Event Date
                  </span>
                </div>
                <p className="text-sm text-gray-900 ml-6">
                  {event.start_date == event.end_date
                    ? formatDate(event.start_date)
                    : `${formatDate(event.start_date)} - ${formatDate(
                        event.end_date
                      )}`}
                </p>
                {event.start_time && event.end_time && (
                  <p className="text-xs text-gray-500 ml-6">
                    {formatTime(event.start_time)} -{" "}
                    {formatTime(event.end_time)}
                  </p>
                )}
              </div>

              {/* Attendees */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Attendees
                  </span>
                </div>
                <p className="text-sm text-gray-900 ml-6">
                  {event.people_count || 0} people
                </p>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Duration
                  </span>
                </div>
                <p className="text-sm text-gray-900 ml-6">
                  {event.start_time && event.end_time
                    ? `${Math.round(
                        (new Date(event.end_time).getTime() -
                          new Date(event.start_time).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days`
                    : "Not set"}
                </p>
              </div>
            </div>

            {/* Media and Documents Row */}
            <div className="flex items-center space-x-6 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <FileImage className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Photos:</span>
                <Badge
                  variant={event.thumbnails?.length ? "default" : "secondary"}
                  className={`text-xs ${
                    event.thumbnails?.length
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {event.thumbnails?.length || 0}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Documents:</span>
                <Badge
                  variant={
                    event.event_documents?.length ? "default" : "secondary"
                  }
                  className={`text-xs ${
                    event.event_documents?.length
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {event.event_documents?.length || 0}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Valuation:</span>
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                >
                  {event.defendability_scores?.digital_valuation
                    ? "Digital"
                    : "Manual"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Section - Scores and Progress */}
          <div className="flex items-center space-x-6 ml-8">
            {/* Defendability Score */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Defendability</div>
              <div
                className={`text-2xl font-bold ${getScoreColor(
                  totalDefendabilityScore,
                  maxDefendabilityScore
                )}`}
              >
                {totalDefendabilityScore}
                <span className="text-sm text-gray-400">
                  /{maxDefendabilityScore}
                </span>
              </div>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative">
              <svg
                className="w-16 h-16 transform -rotate-90"
                viewBox="0 0 64 64"
              >
                {/* Background circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="4"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-teal-600">
                    {eventProgress}
                  </div>
                  <div className="text-xs text-gray-500">/{maxEvents}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
