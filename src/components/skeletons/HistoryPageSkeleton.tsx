import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// History Page Loading Skeleton
export const HistoryPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-6 w-96 mb-4" />
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Selector Skeleton */}
        <Card className="shadow-sm border-gray-100">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="flex items-center space-x-2 mb-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </Card>

        {/* Events Skeleton */}
        <EventsSkeleton />
      </div>
    </div>
  );
};

// Events Loading Skeleton
export const EventsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Individual Event Card Skeleton
export const EventCardSkeleton: React.FC = () => {
  return (
    <Card className="shadow-sm border-gray-100">
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Section */}
          <div className="flex-1 space-y-4">
            {/* Title and Status Row */}
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>

            {/* Address */}
            <Skeleton className="h-4 w-80" />

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>

            {/* Additional Details Row */}
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Right Section - Scores and Progress */}
          <div className="flex items-center space-x-8 ml-6">
            {/* Defendability Score */}
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Valuation Method */}
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Circular Progress */}
            <div className="relative">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-1">
                  <Skeleton className="h-4 w-4 mx-auto" />
                  <Skeleton className="h-3 w-6 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Property Selector Skeleton
export const PropertySelectorSkeleton: React.FC = () => {
  return (
    <Card className="shadow-sm border-gray-100">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="flex items-center space-x-2 mb-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
};

// Empty State Skeleton
export const EmptyStateSkeleton: React.FC = () => {
  return (
    <Card className="shadow-sm border-gray-100">
      <div className="p-8 text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </Card>
  );
};
