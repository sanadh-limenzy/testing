"use client";
import { useState } from "react";
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
import { History, Calendar, MapPin, Building } from "lucide-react";
import type { EventDatabaseWithAllData } from "@/@types/index";
import Link from "next/link";
import { useRentalProperties } from "@/hooks/useAddress";
import { EventCard } from "@/components/history/EventCard";

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
  } = useRentalProperties();

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
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
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
