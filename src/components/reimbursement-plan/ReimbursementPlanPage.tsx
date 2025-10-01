"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ReimbursementPlanSignature from "@/components/esign/reimbursement-plan-signature";
import ManualReimbursementPlanUpload from "@/components/events/ManualReimbursementPlanUpload";
import { useResetReimbursementPlan } from "@/hooks/useReimbursementPlan";
import { useAuth } from "@/hooks/useAuth";
import { ProposalDatabase } from "@/@types";

export default function ReimbursementPlanPage({
  reimbursementPlanData,
}: {
  reimbursementPlanData: ProposalDatabase;
}) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const { session } = useAuth();
  const {
    mutateAsync: resetReimbursementPlan,
    isPending: isSwitchingToSystemGenerated,
  } = useResetReimbursementPlan();

  const [reimbursementPlan, setReimbursementPlan] = useState(
    reimbursementPlanData
  );

  useEffect(() => {
    setReimbursementPlan(reimbursementPlanData);
  }, [reimbursementPlanData]);

  const handleGoBack = () => {
    router.back();
  };

  const handleUseSystemGenerated = async () => {
    if (!session?.access_token) {
      return;
    }

    const { data } = await resetReimbursementPlan(
      { access_token: session.access_token },
      {
        onSuccess: (data) => {
          setReimbursementPlan((prev) => ({
            ...prev,
            signature_doc_url: data.signature_doc_url,
          }));
          setRefreshKey((prev) => prev + 1);
        },
      }
    );
    setReimbursementPlan((prev) => ({
      ...prev,
      signature_doc_url: data.signature_doc_url,
      is_manual_agreement: null,
    }));
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-10 mb-10">
      <h2 className="text-2xl font-bold mb-4">Reimbursement Plan</h2>

      <div className="w-full max-w-6xl h-full overflow-hidden">
        {reimbursementPlan?.signature_doc_url &&
          reimbursementPlan?.signature_doc_url.length > 0 && (
            <iframe
              key={refreshKey} // Force refresh when data changes
              src={reimbursementPlan?.signature_doc_url || ""}
              width="100%"
              height="100%"
              className="w-full h-full"
              title="Reimbursement Plan"
            />
          )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>

        {reimbursementPlan?.is_manual_agreement ? (
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
            <ReimbursementPlanSignature
              proposal_id={reimbursementPlan?.id}
              business_address_id={
                reimbursementPlan?.business_address_id || ""
              }
            />
            <ManualReimbursementPlanUpload />
          </>
        )}
      </div>
    </div>
  );
}
