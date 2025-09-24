"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReimbursementPlan } from "@/hooks/useReimbursementPlan";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileText,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReimbursementPlanSkeleton } from "@/components/skeletons/ReimbursementPlanSkeleton";

export default function ReimbursementPlanPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSwitchingToSystemGenerated, setIsSwitchingToSystemGenerated] =
    useState(false);

  const {
    data: reimbursementPlanData,
    isLoading,
    error,
    refetch,
  } = useReimbursementPlan();

  // const handleUploadSuccess = () => {
  //   refetch();
  //   setRefreshKey((prev) => prev + 1);
  //   router.push("/subscriber/home");
  // };

  const handleGoBack = () => {
    router.back();
  };

  const handleUseSystemGenerated = async () => {
    setIsSwitchingToSystemGenerated(true);
    try {
      const response = await fetch(
        "/api/subscriber/pdf/reimbursement-plan-form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            use_system_generated: true,
          }),
        }
      );

      if (response.ok) {
        refetch();
        setRefreshKey((prev) => prev + 1);
      } else {
        console.error("Failed to switch to system generated plan");
      }
    } catch (error) {
      console.error("Error switching to system generated plan:", error);
    } finally {
      setIsSwitchingToSystemGenerated(false);
    }
  };

  if (isLoading || isSwitchingToSystemGenerated) {
    return <ReimbursementPlanSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-10">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-6 w-6" />
          <span className="text-lg">Error loading reimbursement plan</span>
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
      <h2 className="text-2xl font-bold mb-4">Reimbursement Plan</h2>

      <div className="w-full max-w-6xl h-full overflow-hidden">
        {reimbursementPlanData?.signature_doc_url &&
          reimbursementPlanData?.signature_doc_url.length > 0 && (
            <iframe
              key={refreshKey} // Force refresh when data changes
              src={reimbursementPlanData?.signature_doc_url || ""}
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

        {reimbursementPlanData?.is_manual_agreement ? (
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
            {!reimbursementPlanData?.is_business_signature_done &&
            !reimbursementPlanData?.is_signature_done ? (
              <Button
                onClick={() => {
                  // Handle signature process
                  console.log("Start signature process");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Sign Document
              </Button>
            ) : null}
            <Button
              onClick={() => {
                // Handle manual upload
                console.log("Upload manual reimbursement plan");
              }}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Manual Plan
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
