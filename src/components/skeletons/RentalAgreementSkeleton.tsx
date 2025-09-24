import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Rental Agreement Page Loading Skeleton
export const RentalAgreementSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 mb-10">
      {/* Title Skeleton */}
      <Skeleton className="h-8 w-64 mb-4" />

      {/* Main Content Area Skeleton */}
      <div className="w-full max-w-6xl h-full border rounded-lg overflow-hidden">
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-12 mx-auto rounded-full" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </div>
      </div>

      {/* Button Row Skeleton */}
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
};
