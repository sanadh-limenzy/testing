"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import RentalAgreement from "@/components/esign/rental-agreement";
import ManualRentalAgreementUpload from "@/components/events/ManualRentalAgreementUpload";
import { useSwitchToSystemGenerated } from "@/hooks/useRentalAgreement";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { RentalAgreementSkeleton } from "@/components/skeletons/RentalAgreementSkeleton";
import { ProposalDatabase } from "@/@types";

interface RentalAgreementPageProps {
  rentalAgreementData: ProposalDatabase;
}

export default function RentalAgreementPage({
  rentalAgreementData,
}: RentalAgreementPageProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const switchToSystemGeneratedMutation = useSwitchToSystemGenerated();
  const [rentalAgreement, setRentalAgreement] = useState(rentalAgreementData);

  useEffect(() => {
    setRentalAgreement(rentalAgreementData);
  }, [rentalAgreementData]);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    router.push("/subscriber/home");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleUseSystemGenerated = async () => {
    try {
      const { proposal } = await switchToSystemGeneratedMutation.mutateAsync(
        rentalAgreement.event_id!
      );
      setRentalAgreement(proposal);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error switching to system generated agreement:", error);
    }
  };

  if (switchToSystemGeneratedMutation.isPending) {
    return <RentalAgreementSkeleton />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 mb-10">
      <h2 className="text-2xl font-bold mb-4">Rental Agreement</h2>

      <div className="w-full max-w-6xl h-full overflow-hidden">
        {rentalAgreement?.signature_doc_url &&
          rentalAgreement?.signature_doc_url.length > 0 && (
            <iframe
              key={refreshKey}
              src={rentalAgreement?.signature_doc_url || ""}
              width="100%"
              height="100%"
              className="w-full h-full"
              title="Rental Agreement"
            />
          )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>

        {rentalAgreement?.is_manual_agreement ? (
          <Button
            onClick={handleUseSystemGenerated}
            disabled={switchToSystemGeneratedMutation.isPending}
          >
            {switchToSystemGeneratedMutation.isPending ? (
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
            {!rentalAgreement?.is_business_signature_done &&
            !rentalAgreement?.is_signature_done ? (
              <RentalAgreement event_id={rentalAgreement.event_id!} />
            ) : null}
            <ManualRentalAgreementUpload
              eventId={rentalAgreement.event_id!}
              onUploadSuccess={handleUploadSuccess}
            />
          </>
        )}
      </div>
    </div>
  );
}
