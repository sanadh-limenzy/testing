"use client";
import { useEffect, useState } from "react";
import ReimbursementPlanSignatureCanvas from "./reimbursement-plan-signature-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import ReimbursementPlanNamedSignature from "./reimbursement-plan-named-signature";
import { useAuth } from "@/hooks/useAuth";
import { useSignReimbursementPlan } from "@/hooks/useReimbursementPlan";
import { Input } from "../ui/input";
import { FileUpload } from "../ui/file-upload";
import ESignatureDisclosure from "./e-signature-disclosure";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Tabs = "named" | "draw" | "upload";

// Type for signature data used by ReimbursementPlan components
interface ReimbursementPlanSignatureData {
  business: { signature?: string };
}

const tabs: Tabs[] = ["named", "draw", "upload"];

export default function ReimbursementPlanSignature({
  proposal_id,
  business_address_id,
}: {
  proposal_id: string;
  business_address_id: string;
}) {
  const [signatureData, setSignatureData] = useState<{
    business: { name: string; signature: string };
  }>({
    business: { name: "", signature: "" },
  });

  // Local state for signature preview (not uploaded yet)
  const [localSignature, setLocalSignature] = useState<string>("");

  const [tab, setTab] = useState<Tabs>("named");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [globalDisclosureAccepted, setGlobalDisclosureAccepted] =
    useState(false);
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const { user, session } = useAuth();
  const signReimbursementPlan = useSignReimbursementPlan();

  const [names, setNames] = useState<{
    business: string;
  }>({
    business: user?.user_metadata?.full_name || "",
  });

  useEffect(() => {
    setNames((prev) => ({
      ...prev,
      business: user?.user_metadata?.full_name || "",
    }));
  }, [user]);

  const handleDialogOpen = () => {
    if (!globalDisclosureAccepted) {
      setShowDisclosure(true);
    } else {
      setIsMainDialogOpen(true);
    }
  };

  const handleDisclosureAccepted = () => {
    setGlobalDisclosureAccepted(true);
    setIsMainDialogOpen(true);
  };

  const handleSignatureDataUpdate = (data: ReimbursementPlanSignatureData) => {
    console.log("handleSignatureDataUpdate called with:", data);
    // Update local signature for preview
    setLocalSignature(data.business?.signature || "");
  };

  // Wrapper function for ReimbursementPlanNamedSignature component
  const handleNamedSignatureUpdate = (
    data: (
      prev: ReimbursementPlanSignatureData
    ) => ReimbursementPlanSignatureData
  ) => {
    const currentSignatureData: ReimbursementPlanSignatureData = {
      business: signatureData.business
        ? { signature: signatureData.business.signature }
        : { signature: "" },
    };

    const result = data(currentSignatureData);
    handleSignatureDataUpdate(result);
  };

  const handleSignatureUpload = async (files: File[]) => {
    if (!files[0]) {
      toast.error("Please select a file");
      return;
    }

    setIsUploadingSignature(true);
    try {
      // Convert file to data URL for direct submission
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLocalSignature(result);
        toast.success("Signature ready for submission!");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing signature:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process signature"
      );
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const submit = () => {
    if (!session?.access_token) {
      toast.error("Please log in to sign the document");
      return;
    }

    signReimbursementPlan.mutate({
      business_signature: localSignature,
      proposal_id: proposal_id,
      business_address_id: business_address_id,
      access_token: session.access_token,
    });

    // Reset form state
    setIsMainDialogOpen(false);
    setSignatureData({
      business: { name: "", signature: "" },
    });
    setGlobalDisclosureAccepted(false);
    setLocalSignature("");
  };

  return (
    <div>
      <>
        <Button onClick={handleDialogOpen}>Sign Document</Button>
      </>
      <Dialog
        open={isMainDialogOpen}
        onOpenChange={(open) => {
          setIsMainDialogOpen(open);
          if (!open) {
            // Reset state when dialog is closed
            setTab("named");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign Reimbursement Plan</DialogTitle>
            <DialogDescription>
              Please provide your business signature for the reimbursement plan
            </DialogDescription>
          </DialogHeader>

          {globalDisclosureAccepted && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  Business Signature
                </h3>
                <p className="text-gray-600">
                  Please provide your business signature
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <Input
                  value={names.business}
                  onChange={(e) =>
                    setNames((prev) => ({ ...prev, business: e.target.value }))
                  }
                  placeholder="Enter business name"
                />
              </div>

              <div className="text-center mb-4">
                <h4 className="text-lg font-medium text-blue-600 mb-2">
                  Choose Signature Method
                </h4>
                <p className="text-sm text-gray-600">
                  Select how you&apos;d like to provide your signature
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                {tabs.map((tabName) => (
                  <Button
                    key={tabName}
                    variant={tab === tabName ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTab(tabName);
                      setSignatureData((prev) => ({
                        ...prev,
                        business: { name: names.business, signature: "" },
                      }));
                    }}
                  >
                    {tabName}
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg p-4">
                {tab === "named" && (
                  <ReimbursementPlanNamedSignature
                    setSignatureData={handleNamedSignatureUpdate}
                    name={names.business}
                  />
                )}
                {tab === "draw" && (
                  <ReimbursementPlanSignatureCanvas
                    setSignatureData={handleSignatureDataUpdate}
                  />
                )}
                {tab === "upload" && (
                  <FileUpload
                    acceptedFileTypes={["image/png", "image/jpeg", "image/*"]}
                    onFilesChange={handleSignatureUpload}
                    disabled={isUploadingSignature}
                    placeholder={
                      isUploadingSignature
                        ? "Uploading signature..."
                        : "Upload signature image"
                    }
                  />
                )}
              </div>

              {localSignature && (
                <div className="flex justify-end">
                  <Button
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={submit}
                    disabled={signReimbursementPlan.isPending}
                  >
                    {signReimbursementPlan.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Finish & Save"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Signature Disclosure Dialog */}
      <ESignatureDisclosure
        isOpen={showDisclosure}
        onClose={() => setShowDisclosure(false)}
        onAccept={handleDisclosureAccepted}
        title="E SIGNATURE"
      />
    </div>
  );
}
