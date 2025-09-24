interface EmailFormSkeletonProps {
  title: string;
  description: string;
}

export function EmailFormSkeleton({ 
  title,
  description,
}: EmailFormSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <h4 className="mb-2">{title}</h4>
        <div className="space-y-2">
          <p className=" w-full">{description}</p>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="space-y-2">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-start">
        <div className="h-10 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
      </div>
    </div>
  );
}
