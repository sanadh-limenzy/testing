"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import RentalAgreement from "@/components/esign/rental-agreement";
import ManualRentalAgreementUpload from "@/components/events/ManualRentalAgreementUpload";
import { useRentalAgreement } from "@/hooks/useRentalAgreement";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { RentalAgreementSkeleton } from "@/components/skeletons/RentalAgreementSkeleton";

interface RentalAgreementPageProps {
  eventId: string;
}

export default function RentalAgreementPage({
  eventId,
}: RentalAgreementPageProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSwitchingToSystemGenerated, setIsSwitchingToSystemGenerated] =
    useState(false);

  const {
    data: rentalAgreementData,
    isLoading,
    error,
    refetch,
  } = useRentalAgreement(eventId);

  const handleUploadSuccess = () => {
    // Trigger a refetch of the rental agreement data
    refetch();
    setRefreshKey((prev) => prev + 1);

    // Redirect to homepage after successful manual upload
    router.push("/subscriber/home");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleUseSystemGenerated = async () => {
    setIsSwitchingToSystemGenerated(true);
    try {
      // Call API to switch back to system generated agreement
      const response = await fetch(
        "/api/subscriber/pdf/rental-agreement-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventId,
            use_system_generated: true,
          }),
        }
      );

      if (response.ok) {
        // Refetch data to get updated agreement
        refetch();
        setRefreshKey((prev) => prev + 1);
      } else {
        console.error("Failed to switch to system generated agreement");
      }
    } catch (error) {
      console.error("Error switching to system generated agreement:", error);
    } finally {
      setIsSwitchingToSystemGenerated(false);
    }
  };

  if (isLoading || isSwitchingToSystemGenerated) {
    return <RentalAgreementSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-10">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-6 w-6" />
          <span className="text-lg">Error loading rental agreement</span>
        </div>
        <p className="text-gray-600 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 mb-10">
      <h2 className="text-2xl font-bold mb-4">Rental Agreement</h2>

      <div className="w-full max-w-6xl h-full overflow-hidden">
        <iframe
          key={refreshKey} // Force refresh when data changes
          src={rentalAgreementData?.signature_doc_url || ""}
          width="100%"
          height="100%"
          className="w-full h-full"
          title="Rental Agreement"
        />
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>

        {rentalAgreementData?.is_manual_agreement ? (
          <Button
            onClick={handleUseSystemGenerated}
            disabled={isSwitchingToSystemGenerated}
          >
            {isSwitchingToSystemGenerated ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Switching...
              </>
            ) : (
              "Use System Generated"
            )}
          </Button>
        ) : (
          <>
            {!rentalAgreementData?.is_business_signature_done &&
            !rentalAgreementData?.is_signature_done ? (
              <RentalAgreement event_id={eventId} />
            ) : null}
            <ManualRentalAgreementUpload
              eventId={eventId}
              onUploadSuccess={handleUploadSuccess}
            />
          </>
        )}
      </div>
    </div>
  );
}
