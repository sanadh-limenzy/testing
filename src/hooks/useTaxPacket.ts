import { useState } from "react";
import { toast } from "sonner";

interface UseTaxPacketOptions {
  selectedYear?: string;
}

export function useTaxPacket({ selectedYear = "2025" }: UseTaxPacketOptions = {}) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingSend, setIsLoadingSend] = useState(false);

  const generatePreview = async () => {
    setIsLoadingPreview(true);
    
    // Show loading toast
    const toastId = toast.loading("Generating tax packet preview...", {
      description: "This may take a few moments"
    });

    try {
      const response = await fetch(
        `/api/subscriber/pdf/tax-packet-preview?selected_year=${selectedYear}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate preview");
      }

      if (data.success && data.data?.pdfPath) {
        // Dismiss loading toast
        toast.dismiss(toastId);
        
        // Show success toast
        toast.success("Tax packet preview generated successfully!", {
          description: "Opening preview in new tab"
        });
        
        // Open PDF in new tab
        window.open(data.data.pdfPath, '_blank');
        
        return data;
      } else {
        throw new Error(data.error || "Failed to generate preview");
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      // Show error toast
      toast.error("Failed to generate preview", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      
      console.error("Preview packet error:", error);
      throw error;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const sendPacket = async (email: string, ccOwnEmail: boolean = false) => {
    // Validate email before proceeding
    if (!email.trim()) {
      toast.error("Email is required", {
        description: "Please enter an email address before sending the packet"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Invalid email format", {
        description: "Please enter a valid email address"
      });
      return;
    }

    setIsLoadingSend(true);
    
    // Show loading toast
    const toastId = toast.loading("Sending tax packet...", {
      description: "Please wait while we send your packet"
    });

    try {
      // TODO: Implement actual send packet API call
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      // Show success toast
      toast.success("Tax packet sent successfully!", {
        description: `Your tax packet has been sent to ${email}`
      });
      
      console.log("Send packet", { email, ccOwnEmail, selectedYear });
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      // Show error toast
      toast.error("Failed to send packet", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      
      console.error("Send packet error:", error);
      throw error;
    } finally {
      setIsLoadingSend(false);
    }
  };

  return {
    isLoadingPreview,
    isLoadingSend,
    generatePreview,
    sendPacket,
    isAnyLoading: isLoadingPreview || isLoadingSend,
  };
}
