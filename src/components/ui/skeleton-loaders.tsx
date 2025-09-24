import React from "react";
import { Skeleton } from "./skeleton";
import { LoadingSpinner } from "./loading-spinner";

// Auth Page Skeleton
export const AuthPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>

          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Completion Skeleton
export const ProfileCompletionSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center w-full">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-8 text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>

        {/* Progress indicator skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-6">
          <div className="text-center">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-4 w-96 mb-6" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-primary/10 p-6 rounded-lg">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Profile Completion Wrapper Skeleton
export const ProfileWrapperSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-50 w-full">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProfileCompletionSkeleton />
        </div>
      </main>
    </div>
  );
};

// Skeleton List Component
export const SkeletonList: React.FC<{ 
  count?: number; 
  className?: string; 
  itemClassName?: string; 
}> = ({ 
  count = 4, 
  className = "space-y-2 p-4", 
  itemClassName = "h-6 w-full animate-pulse rounded-md bg-gray-200" 
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={itemClassName} />
      ))}
    </div>
  );
};

// Event Form Skeleton
export const EventFormSkeleton: React.FC<{ showSidebar?: boolean }> = ({ 
  showSidebar = true 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
          
          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              {/* Residence */}
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Event Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Event Timing Section */}
            <div className="space-y-4">
              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              {/* Time Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Attendees Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Rental Section */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* Toggle switches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Areas Section */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>

            {/* Photos Section */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="space-y-6">
          {/* Tax Deductions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
            
            <Skeleton className="h-3 w-full mb-4" />
            
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            {/* Events Used Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-2 w-full mb-2" />
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>

          {/* Defensibility Score Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
            
            <Skeleton className="h-4 w-48 mb-6" />
            
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 rounded-full mt-1" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Generic Loading Skeleton
export const GenericSkeleton: React.FC<{ message?: string }> = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
    </div>
  );
};
