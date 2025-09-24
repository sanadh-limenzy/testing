"use client";

import React from "react";
import { ProfileCompletion } from "@/components/profile/ProfileCompletion";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { ProfileWrapperSkeleton } from "@/components/ui/skeleton-loaders";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ProfileCompletionWrapperProps {
  user: User;
}

export function ProfileCompletionWrapper({
  user,
}: ProfileCompletionWrapperProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: profileStatus,
    isLoading: checkingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ["profile-status", user.id],
    queryFn: async () => {
      const response = await fetch("/api/profile/status");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to check profile status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error?.message?.includes("User not authenticated")) {
        router.push("/auth");
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleProfileComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["profile-status", user.id] });
  };

  React.useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  React.useEffect(() => {
    if (
      profileError &&
      profileError.message?.includes("User not authenticated")
    ) {
      router.push("/auth");
    }
  }, [profileError, router]);

  if (checkingProfile) {
    return <ProfileWrapperSkeleton />;
  }

  if (profileError) {
    if (profileError.message?.includes("User not authenticated")) {
      return null;
    }
  }

  if (user && profileStatus && !profileStatus.isProfileComplete) {
    if (profileStatus.userType === "Subscriber") {
      return (
        <div className="bg-gray-50 w-full">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <ProfileCompletion onComplete={handleProfileComplete} />
            </div>
          </main>
        </div>
      );
    }

    return null;
  }

  return null;
}
