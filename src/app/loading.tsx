import { LoadingSpinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <LoadingSpinner size="lg" message="Loading..." />
    </div>
  );
}
