"use client";

import React, { useState, useEffect } from "react";
import { UserTypeStep, UserType } from "../signup/UserTypeStep";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

interface SignupFlowProps {
  onComplete?: () => void;
}

export const SignupFlow: React.FC<SignupFlowProps> = ({ onComplete }) => {
  const { user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
    }
  }, [user, authLoading]);

  const handleUserTypeSelection = async (userType: UserType) => {
    setLoading(true);
    setError("");

    try {
      // Update user profile with user type
      const response = await fetch(
        "/api/profile/update-user-type",
        {
          method: "POST",
          body: JSON.stringify({ userType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user type");
      }

      // Redirect to main app
      onComplete?.();
      router.push("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update user type";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (authLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Complete Your Signup
        </h1>
        <p className="mt-2 text-gray-600">
          Please check your email and confirm your account, then choose your
          account type
        </p>
      </div>

      <UserTypeStep
        onNext={handleUserTypeSelection}
        loading={loading}
        error={error}
      />
    </div>
  );
};
