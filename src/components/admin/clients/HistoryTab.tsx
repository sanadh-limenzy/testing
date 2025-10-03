"use client";

import { Clock } from "lucide-react";
import { EventCard } from "@/components/history/EventCard";
import { EventCardSkeleton } from "@/components/skeletons/HistoryPageSkeleton";
import { EventDatabaseWithAllData } from "@/@types/index";
import { toast } from "sonner";

interface HistoryTabProps {
  isLoading: boolean;
  events: EventDatabaseWithAllData[];
  onRefetch?: () => void;
}

export function HistoryTab({ isLoading, events, onRefetch }: HistoryTabProps) {
  const handleDelete = async (event: EventDatabaseWithAllData) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Event deleted successfully");
      
      // Refetch events after deletion
      if (onRefetch) {
        onRefetch();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Clock className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mb-4" />
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          No Result Found
        </p>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          No events available for this client
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onDelete={handleDelete} />
      ))}
    </div>
  );
}

