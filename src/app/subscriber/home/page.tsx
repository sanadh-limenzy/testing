"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  Plus,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { EventDatabase } from "@/@types/index";
import { format, isAfter, startOfDay } from "date-fns";
import { useRentalProperties } from "@/hooks/useAddress";
import { useUserData } from "@/hooks/useUserData";

export default function SubscriberHome() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({});

  const {
    data: rentalPropertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError,
    refetch: refetchProperties,
  } = useRentalProperties();

  const {
    userData,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useUserData();

  const rentalProperties = useMemo(() => {
    rentalPropertiesData?.data.forEach((property) => {
      setIsExpanded((prev) => ({ ...prev, [property.id]: false }));
    });
    return rentalPropertiesData?.data || [];
  }, [rentalPropertiesData?.data]);

  const userProfile = userData?.userProfile;
  const subscriberProfile = userData?.subscriberProfile;

  // Fetch all events for dynamic calculations
  const {
    data: allEventsData,
    isLoading: isLoadingAllEvents,
    error: allEventsError,
  } = useQuery<{ success: boolean; data: EventDatabase[] }>({
    queryKey: ["all-events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch events");
      }
      return response.json();
    },
    enabled: rentalProperties.length > 0,
  });

  // Calculate dynamic data for each property
  const propertyData = useMemo(() => {
    const allEvents = allEventsData?.data || [];

    return rentalProperties.map((property) => {
      // Filter events for this property
      const propertyEvents = allEvents.filter(
        (event) => event.rental_address_id === property.id
      );

      const pastDeductions = propertyEvents.reduce(
        (sum, event) => sum + (event.amount || 0),
        0
      );

      // Calculate average rental rate for potential savings
      const averageRentalRate =
        propertyEvents.length > 0 ? pastDeductions / propertyEvents.length : 0;

      // Calculate potential annual savings (remaining days * average rate)
      const eventsUsed = propertyEvents.filter(
        (event) => event.is_completed_event
      ).length;
      const remainingEvents = Math.max(0, 14 - eventsUsed);
      const potentialAnnualSavings = remainingEvents * averageRentalRate;

      // Calculate progress percentage
      const progressPercentage = Math.min(
        100,
        (pastDeductions / (pastDeductions + potentialAnnualSavings)) * 100
      );

      // Get upcoming events (not completed, future dates)
      const today = startOfDay(new Date());
      const upcomingEvents = propertyEvents
        .filter(
          (event) =>
            !event.is_completed_event &&
            event.start_date &&
            isAfter(startOfDay(new Date(event.start_date)), today)
        )
        .sort(
          (a, b) =>
            new Date(a.start_date!).getTime() -
            new Date(b.start_date!).getTime()
        );

      // Get next event
      const nextEvent = upcomingEvents[0];

      return {
        ...property,
        pastDeductions,
        potentialAnnualSavings,
        progressPercentage,
        upcomingEvents,
        nextEvent,
        averageRentalRate,
        isLoadingEvents: isLoadingAllEvents,
        eventsError: allEventsError,
      };
    });
  }, [rentalProperties, allEventsData, isLoadingAllEvents, allEventsError]);

  if (isLoadingProperties || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isLoadingUser
                  ? "Loading user data..."
                  : "Loading rental properties..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (propertiesError || userError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">
                {userError
                  ? "Failed to load user data"
                  : "Failed to load rental properties"}
              </p>
              <div className="space-x-2">
                {propertiesError && (
                  <Button
                    onClick={() => refetchProperties()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Retry Properties
                  </Button>
                )}
                {userError && (
                  <Button
                    onClick={() => refetchUser()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Retry User Data
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome,{" "}
              {userProfile?.first_name && userProfile?.last_name
                ? `${userProfile.first_name} ${userProfile.last_name}`
                : user?.user_metadata?.full_name || "User"}
            </h3>
            {subscriberProfile?.business_name && (
              <p className="text-sm text-gray-600 mt-1">
                {subscriberProfile.business_name}
              </p>
            )}
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manage Rental Residence</span>
            <span className="sm:hidden">Manage Residence</span>
          </Button>
        </div>

        {subscriberProfile?.reimbursement_plan?.is_business_signature_done &&
        subscriberProfile.reimbursement_plan.is_signature_done ? null : (
          <Card className="bg-yellow-100 border-yellow-200 p-4 sm:p-6">
            <div className="flex items-start space-x-2 mb-3">
              <span className="text-yellow-600 font-bold">⚠️</span>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Do you currently have a Reimbursement Plan?
              </h2>
            </div>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              A reimbursement plan protects you in the event of an audit.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium w-full sm:w-auto">
                No thanks, I already have one
              </Button>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium w-full sm:w-auto">
                Sign Reimbursement Plan
              </Button>
            </div>
          </Card>
        )}

        {propertyData.map((property) => (
          <Card key={property.id} className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {property.nickname ||
                      `${property.street}, ${property.city}, ${property.state} ${property.zip}`}
                  </h2>
                  {property.nickname && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {property.street}, {property.city}, {property.state}{" "}
                      {property.zip}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 flex-shrink-0">
                <div className="flex justify-between sm:flex sm:space-x-8">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Events Used
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {property.number_of_days_used}/14
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Next Event
                    </p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">
                      {property.nextEvent
                        ? format(
                            new Date(property.nextEvent.start_date!),
                            "MMM dd, yyyy"
                          )
                        : "None scheduled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
                  <Link
                    href={`/subscriber/events/create?residence=${property.id}`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto text-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Create Event</span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setIsExpanded((prev) => ({
                        ...prev,
                        [property.id]: !prev[property.id],
                      }))
                    }
                    className="p-1 flex-shrink-0"
                  >
                    {isExpanded[property.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isExpanded[property.id] && (
              <>
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Create New Event Card */}
                  <Card className="bg-blue-500 text-white p-4 sm:p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold">
                        Create New Event
                      </h3>
                    </div>
                    <p className="text-blue-100 mb-4 text-sm sm:text-base">
                      Start a new Augusta Rule event for this property
                    </p>
                    <p className="text-blue-100 mb-6 text-sm sm:text-base">
                      Ready to create your next event at this location?
                    </p>
                    <Link
                      href={`/subscriber/events/create?residence=${encodeURIComponent(
                        property.nickname ||
                          `${property.street}, ${property.city}, ${property.state} ${property.zip}`
                      )}`}
                      className="w-full"
                    >
                      <Button className="bg-white text-blue-500 hover:bg-blue-50 w-full text-sm sm:text-base">
                        Create Event
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </Card>

                  {/* Available Events Card */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      Available Events
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                      Events remaining for this property
                    </p>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            Events Used
                          </span>
                          <span className="text-base sm:text-lg font-bold text-gray-900">
                            {property.number_of_days_used} / 14
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                          <div
                            className="bg-teal-600 h-2 sm:h-3 rounded-full"
                            style={{
                              width: `${
                                (property.number_of_days_used / 14) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {14 - property.number_of_days_used} events remaining
                        this year
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Tax Deductions Section */}
                <Card className="mt-4 sm:mt-6 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-500 mb-4 sm:mb-6 tracking-wide">
                    TAX DEDUCTIONS
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                    <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                      {property.isLoadingEvents ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                      ) : (
                        `$${property.pastDeductions.toLocaleString()}`
                      )}
                    </div>
                    <div className="text-2xl sm:text-4xl font-bold text-gray-900">
                      {property.isLoadingEvents ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
                      ) : (
                        `$${property.potentialAnnualSavings.toLocaleString()}`
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-4">
                    <div
                      className="bg-green-500 h-3 sm:h-4 rounded-full transition-all duration-500"
                      style={{ width: `${property.progressPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-1 sm:space-y-0">
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      Past taxes deductions
                    </span>
                    <span className="text-xs sm:text-sm text-blue-600 cursor-pointer hover:underline font-medium">
                      Potential Annual Savings
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    *Calculated on the average rental rate of your past events
                    for this property
                  </p>
                </Card>

                {/* Upcoming Events Section */}
                <Card className="mt-4 sm:mt-6 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        Upcoming Events
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Scheduled events for this property
                      </p>
                    </div>
                  </div>

                  {property.isLoadingEvents ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">
                        Loading upcoming events...
                      </p>
                    </div>
                  ) : property.upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {property.upcomingEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {event.title || "Untitled Event"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {event.start_date &&
                                  format(
                                    new Date(event.start_date),
                                    "MMM dd, yyyy"
                                  )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {event.amount
                                ? `$${event.amount.toLocaleString()}`
                                : "TBD"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {event.people_count || 0} attendees
                            </p>
                          </div>
                        </div>
                      ))}
                      {property.upcomingEvents.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{property.upcomingEvents.length - 3} more events
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-gray-600 mb-4 text-sm sm:text-base">
                        No upcoming events scheduled
                      </p>
                      <Link
                        href={`/subscriber/events/create?residence=${encodeURIComponent(
                          property.nickname ||
                            `${property.street}, ${property.city}, ${property.state} ${property.zip}`
                        )}`}
                      >
                        <Button
                          variant="outline"
                          className="border-gray-300 bg-transparent w-full sm:w-auto text-sm sm:text-base"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Event
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
