"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmailFormSkeleton } from "@/components/skeletons/EmailFormSkeleton";
import { useUserData } from "@/hooks/useUserData";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function AccountsPayableEmail() {
  const { userData, refetch, isLoading: isUserDataLoading } = useUserData();
  const [email, setEmail] = useState(
    userData?.subscriberProfile?.accounts_payable_email || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    // Clear previous errors
    setError("");
    
    // Allow empty string (no emails)
    if (!email.trim()) {
      // Proceed with empty string - this is allowed
    } else {
      // If there are emails, validate them
      const emails = email.split(",").map(e => e.trim()).filter(e => e.length > 0);
      
      if (emails.length > 0) {
        // Validate email format using zod email validation
        const invalidEmails = emails.filter(e => {
          try {
            // We can't import zod in the component, so use regex for now
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !emailRegex.test(e);
          } catch {
            return true;
          }
        });
        
        if (invalidEmails.length > 0) {
          setError(`Invalid email format: ${invalidEmails.join(", ")}`);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/subscriber/profile/accounts-payable-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accounts_payable_email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update accounts payable email");
      }

      toast.success("Accounts payable email updated successfully");
      
      // Refetch user data to update the UI
      await refetch();
    } catch (error) {
      console.error("Error updating accounts payable email:", error);
      setError(error instanceof Error ? error.message : "Failed to update email");
      toast.error("Failed to update accounts payable email");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentEmail = userData?.subscriberProfile?.accounts_payable_email;
    if (currentEmail) {
      setEmail(currentEmail);
    }
  }, [userData?.subscriberProfile?.accounts_payable_email]);

  // Show skeleton while loading user data
  if (isUserDataLoading) {
    return (
      <EmailFormSkeleton 
        title="Accounts Payable Email"
        description="The email(s) you enter will receive automated Event Invoices when they are created. You can provide one or more email addresses separated by commas, or leave empty."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Accounts Payable Email
        </h3>
        <p className="text-gray-600 text-sm">
          The email(s) you enter will receive automated Event Invoices when they
          are created. You can provide one or more email addresses separated by commas, or leave empty.
          Example: user1@email.com, user2@email.com
        </p>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="user1@email.com, user2@email.com (optional)"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(""); // Clear error when user types
          }}
          className={`w-full h-12 text-base bg-gray-50 border-gray-200 rounded-lg ${
            error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
          }`}
          disabled={isLoading}
        />
        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-start">
        <Button 
          onClick={handleSave} 
          className="px-6 py-2 rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
