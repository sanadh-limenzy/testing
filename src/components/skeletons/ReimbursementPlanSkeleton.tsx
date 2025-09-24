import { Skeleton } from "@/components/ui/skeleton";

export function ReimbursementPlanSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-10">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="w-full max-w-6xl h-full">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
