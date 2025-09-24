import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AddressInformationInProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Residence Cards Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-2 border-gray-200">
            <CardContent className="px-3 py-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Residence Name Skeleton */}
                  <div className="mb-3">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-0.5 w-12 bg-orange-200" />
                  </div>

                  {/* Address Skeleton */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Right Side - Progress and Edit Button Skeleton */}
                <div className="flex items-center space-x-4">
                  {/* Progress Circle Skeleton */}
                  <div className="relative">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Skeleton className="h-4 w-8 mb-1" />
                        <Skeleton className="h-3 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Edit Button Skeleton */}
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}