"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AuthPageSkeleton } from "@/components/ui/skeleton-loaders";

export default function VerifyPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if user is authenticated (email confirmed)
        if (user && !loading) {
          setVerificationStatus("success");
          setIsVerifying(false);
        } else if (!loading) {
          // If not authenticated after loading, verification failed
          setVerificationStatus("error");
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setVerificationStatus("error");
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [user, loading]);

  if (loading || isVerifying) {
    return <AuthPageSkeleton />;
  }

  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email Verified!
            </h1>
            <p className="mt-2 text-gray-600">
              Your email has been successfully verified. Now let&apos;s complete
              your account setup.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Button
              onClick={() => router.push("/auth?mode=signup")}
              className="w-full"
            >
              Complete Account Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verification Failed
            </h1>
            <p className="mt-2 text-gray-600">
              There was an issue verifying your email. Please try again or
              contact support.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <Button onClick={() => router.push("/auth")} className="w-full">
              Back to Sign In
            </Button>
            <Button
              onClick={() => router.push("/auth?mode=signup")}
              variant="outline"
              className="w-full"
            >
              Try Signing Up Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthPageSkeleton />;
}
