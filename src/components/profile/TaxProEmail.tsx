"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmailFormSkeleton } from "@/components/skeletons/EmailFormSkeleton";
import { useUserData } from "@/hooks/useUserData";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TaxProEmail() {
  const { userData, refetch, isLoading: isUserDataLoading } = useUserData();
  const [email, setEmail] = useState(
    userData?.subscriberProfile?.accountant_profile?.user_profile?.email || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error("Please enter a tax pro email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/subscriber/tax-pro-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save tax pro email");
      }

      toast.success("Tax pro email saved successfully!");

      // Refetch user data to get updated information
      await refetch();
    } catch (error) {
      console.error("Error saving tax pro email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save tax pro email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentEmail =
      userData?.subscriberProfile?.accountant_profile?.user_profile?.email;
    if (currentEmail) {
      setEmail(currentEmail);
    }
  }, [userData?.subscriberProfile?.accountant_profile?.user_profile?.email]);

  // Show skeleton while loading user data
  if (isUserDataLoading) {
    return (
      <EmailFormSkeleton 
        title="Tax Pro Email"
        description="The person who files your taxes."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tax Pro Email</h3>
        <p className="text-gray-600 text-sm">
          The person who files your taxes.
        </p>
      </div>

      {/* Email Input */}
      <div>
        <Input
          type="email"
          placeholder="Please enter Tax Pro Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 text-base bg-gray-50 border-gray-200 rounded-lg"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-start">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 rounded-lg"
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
