"use client";
import { useEffect, useState } from "react";
import SignatureCanvas from "./signnature-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import NamedSignature from "./named-signature";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Input } from "../ui/input";
import { FileUpload } from "../ui/file-upload";
import ESignatureDisclosure from "./e-signature-disclosure";
import Image from "next/image";
import { env } from "@/env";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tabs = "named" | "draw" | "upload";
type SigningFor = "lessee" | "lessor";

// Type for signature data used by NamedSignature component
interface SignatureComponentData {
  lessee?: { signature?: string };
  lessor?: { signature?: string };
}

const tabs: Tabs[] = ["named", "draw", "upload"];

export default function RentalAgreement({ event_id }: { event_id: string }) {
  const [signatureData, setSignatureData] = useState<{
    lessee: { name: string; signature: string };
    lessor: { name: string; signature: string };
  }>({
    lessee: { name: "", signature: "" },
    lessor: { name: "", signature: "" },
  });

  const [tab, setTab] = useState<Tabs>("named");
  const [currentSigner, setCurrentSigner] = useState<SigningFor>("lessee");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [globalDisclosureAccepted, setGlobalDisclosureAccepted] =
    useState(false);
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "lessee" | "lessor" | "complete"
  >("lessee");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const { user, session } = useAuth();
  const { mutateAsync: uploadFiles } = useFileUpload();
  const router = useRouter();

  const [names, setNames] = useState<{
    lessee: string;
    lessor: string;
  }>({
    lessee: user?.user_metadata?.full_name || "",
    lessor: user?.user_metadata?.full_name || "",
  });

  useEffect(() => {
    setNames((prev) => ({
      ...prev,
      lessee: user?.user_metadata?.full_name || "",
      lessor: user?.user_metadata?.full_name || "",
    }));
  }, [user]);

  const handleDialogOpen = () => {
    if (!globalDisclosureAccepted) {
      setShowDisclosure(true);
    } else {
      //   setIsMainDialogOpen(true);
    }
  };

  const handleDisclosureAccepted = () => {
    setGlobalDisclosureAccepted(true);
    setCurrentStep("lessee");
    setCurrentSigner("lessee");
    setIsMainDialogOpen(true);
  };

  const handleSignatureDataUpdate = (data: {
    lessee?: { signature?: string };
    lessor?: { signature?: string };
  }) => {
    setSignatureData((prev) => {
      const newData = {
        ...prev,
        [currentSigner]: {
          name: names[currentSigner],
          signature: data[currentSigner]?.signature || "",
        },
      };
      return newData;
    });
  };

  // Wrapper function for NamedSignature component that matches the expected interface
  const handleNamedSignatureUpdate = (
    data: (prev: SignatureComponentData) => SignatureComponentData
  ) => {
    const currentSignatureData: SignatureComponentData = {
      lessee: signatureData.lessee
        ? { signature: signatureData.lessee.signature }
        : undefined,
      lessor: signatureData.lessor
        ? { signature: signatureData.lessor.signature }
        : undefined,
    };

    const result = data(currentSignatureData);

    // Extract the signature from the result
    let signature = "";
    if (result[currentSigner as keyof SignatureComponentData]) {
      signature =
        result[currentSigner as keyof SignatureComponentData]!.signature || "";
    } else {
      const signerData = result[currentSigner as keyof SignatureComponentData];
      if (
        signerData &&
        typeof signerData === "object" &&
        "signature" in signerData
      ) {
        signature = signerData.signature || "";
      }
    }

    handleSignatureDataUpdate({ [currentSigner]: { signature } });
  };

  const handleSignatureUpload = async (
    files: File[],
    signerType: "lessee" | "lessor"
  ) => {
    if (!files[0] || !session?.access_token) {
      toast.error("Please select a file and ensure you're logged in");
      return;
    }

    setIsUploadingSignature(true);
    try {
      // Upload the signature file to S3
      const uploadResult = await uploadFiles({
        files: [files[0]],
        folder: "signatures",
      });

      if (!uploadResult.success || !uploadResult.data?.uploadedFiles[0]) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      const uploadedFile = uploadResult.data.uploadedFiles[0];

      // Update signature data with S3 URL
      handleSignatureDataUpdate({
        [signerType]: {
          signature: uploadedFile.url,
        },
      });

      toast.success("Signature uploaded successfully!");
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload signature"
      );
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === "lessee" && signatureData.lessee.signature) {
      setCurrentStep("lessor");
      setCurrentSigner("lessor");
      setTab("named"); // Reset to first tab for next signer
    } else if (currentStep === "lessor" && signatureData.lessor.signature) {
      setCurrentStep("complete");
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_APP_URL}/api/subscriber/pdf/sign-rental-agreement-form`,
        {
          method: "POST",
          body: JSON.stringify({
            event_id,
            lessee_signature: signatureData.lessee.signature,
            lessor_signature: signatureData.lessor.signature,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Rental agreement signed successfully!");
        setIsMainDialogOpen(false);
        setCurrentStep("lessee");
        setSignatureData({
          lessee: { name: "", signature: "" },
          lessor: { name: "", signature: "" },
        });
        setGlobalDisclosureAccepted(false);

        // Redirect to homepage after successful submission
        router.push("/subscriber/home");
      } else {
        console.error("Failed to submit rental agreement");
        toast.error("Failed to submit rental agreement");
      }
    } catch (error) {
      console.error("Error submitting rental agreement:", error);
      toast.error("An error occurred while submitting the rental agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <>
        <Button onClick={handleDialogOpen}>Sign Rental Agreement</Button>
      </>
      <Dialog
        open={isMainDialogOpen}
        onOpenChange={(open) => {
          setIsMainDialogOpen(open);
          if (!open) {
            // Reset state when dialog is closed
            setCurrentStep("lessee");
            setCurrentSigner("lessee");
            setTab("named");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sign Rental Agreement</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          {/* Current Step Content */}
          {currentStep === "lessee" && globalDisclosureAccepted && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  Lessee Signature
                </h3>
                <p className="text-gray-600">
                  Please provide the lessee&apos;s signature
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lessee Name
                </label>
                <Input
                  value={names.lessee}
                  onChange={(e) =>
                    setNames((prev) => ({ ...prev, lessee: e.target.value }))
                  }
                  placeholder="Enter lessee name"
                />
              </div>

              {globalDisclosureAccepted && (
                <>
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
                          if (currentSigner === "lessee") {
                            setSignatureData((prev) => ({
                              ...prev,
                              lessee: { name: names.lessee, signature: "" },
                            }));
                          } else {
                            setSignatureData((prev) => ({
                              ...prev,
                              lessor: { name: names.lessor, signature: "" },
                            }));
                          }
                        }}
                      >
                        {tabName}
                      </Button>
                    ))}
                  </div>

                  <div className="border rounded-lg p-4">
                    {tab === "named" && (
                      <NamedSignature
                        setSignatureData={handleNamedSignatureUpdate}
                        signFor="lessee"
                        name={names.lessee}
                      />
                    )}
                    {tab === "draw" && (
                      <SignatureCanvas
                        setSignatureData={handleSignatureDataUpdate}
                        signFor="lessee"
                      />
                    )}
                    {tab === "upload" && (
                      <FileUpload
                        acceptedFileTypes={[
                          "image/png",
                          "image/jpeg",
                          "image/*",
                        ]}
                        onFilesChange={(files) =>
                          handleSignatureUpload(files, "lessee")
                        }
                        disabled={isUploadingSignature}
                        placeholder={
                          isUploadingSignature
                            ? "Uploading signature..."
                            : "Upload signature image"
                        }
                      />
                    )}
                  </div>
                </>
              )}

              {signatureData.lessee.signature && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Lessor Signature
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === "lessor" && globalDisclosureAccepted && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-purple-600 mb-2">
                  Lessor Signature
                </h3>
                <p className="text-gray-600">
                  Please provide the lessor&apos;s signature
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lessor Name
                </label>
                <Input
                  value={names.lessor}
                  onChange={(e) =>
                    setNames((prev) => ({ ...prev, lessor: e.target.value }))
                  }
                  placeholder="Enter lessor name"
                />
              </div>

              {globalDisclosureAccepted && (
                <>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-medium text-purple-600 mb-2">
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
                        onClick={() => setTab(tabName)}
                      >
                        {tabName}
                      </Button>
                    ))}
                  </div>

                  <div className="border rounded-lg p-4">
                    {tab === "named" && (
                      <NamedSignature
                        setSignatureData={handleNamedSignatureUpdate}
                        signFor="lessor"
                        name={names.lessor}
                      />
                    )}
                    {tab === "draw" && (
                      <SignatureCanvas
                        setSignatureData={handleSignatureDataUpdate}
                        signFor="lessor"
                      />
                    )}
                    {tab === "upload" && (
                      <FileUpload
                        acceptedFileTypes={[
                          "image/png",
                          "image/jpeg",
                          "image/*",
                        ]}
                        onFilesChange={(files) =>
                          handleSignatureUpload(files, "lessor")
                        }
                        disabled={isUploadingSignature}
                        placeholder={
                          isUploadingSignature
                            ? "Uploading signature..."
                            : "Upload signature image"
                        }
                      />
                    )}
                  </div>
                </>
              )}

              {signatureData.lessor.signature && (
                <div className="flex justify-end">
                  <Button onClick={handleNextStep} className="mt-3">
                    Complete Agreement
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  Rental Agreement Signed!
                </h3>
                <p className="text-gray-600 mb-6">
                  Both lessee and lessor signatures have been collected
                  successfully.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">Lessee</p>
                    <p className="text-blue-600">{names.lessee}</p>
                    <div className="flex justify-center">
                      <Image
                        src={signatureData.lessee.signature}
                        alt="Lessee Signature"
                        width={100}
                        height={100}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-800">Lessor</p>
                    <p className="text-purple-600">{names.lessor}</p>
                    <div className="flex justify-center">
                      <Image
                        src={signatureData.lessor.signature}
                        alt="Lessor Signature"
                        width={100}
                        height={100}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={submit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Finish & Save"
                  )}
                </Button>
              </div>
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
