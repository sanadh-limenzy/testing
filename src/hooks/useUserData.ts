import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  AccountantProfile,
  SubscriberProfile,
  UserProfile,
} from "@/@types/user";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileFormData } from "@/components/profile/EditProfileModal";
import { ProposalDatabase } from "@/@types";

export interface UserData {
  userProfile: UserProfile;
  subscriberProfile?: SubscriberProfile & {
    accountant_profile?:
      | (AccountantProfile & {
          user_profile?: UserProfile | null;
        })
      | null;
    reimbursement_plan?: ProposalDatabase | null;
  };
  accountantProfile?: AccountantProfile;
}

/**
 * Custom hook for fetching and managing user data including profile, subscriber, and accountant information.
 *
 * This hook provides a unified interface to access user-related data from the API endpoint `/api/user_data`.
 * It automatically handles authentication state and provides retry logic for failed requests.
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { userData, isLoading, error } = useUserData();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!userData) return <div>No user data</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {userData.userProfile.first_name}</h1>
 *       {userData.subscriberProfile && (
 *         <p>Business: {userData.subscriberProfile.business_name}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - The hook only executes when a user is authenticated (`enabled: !!user`)
 * - Implements retry logic with up to 3 attempts for transient failures
 * - Automatically stops retrying on authentication errors
 * - Uses React Query for caching and background updates
 * - Query key: `["user-data"]`
 */
export const useUserData = () => {
  const { user } = useAuth();
  const query = useQuery<UserData>({
    queryKey: ["user-data"],
    queryFn: async () => {
      const response = await fetch("/api/user_data");
      return response.json();
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error?.message?.includes("User not authenticated")) {
        return false;
      }
      return failureCount < 3;
    },
  });
  const { data: userData, ...rest } = query;
  return { userData, ...rest };
};

interface UpdateProfileResponse {
  success: boolean;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_code?: string;
    phone?: string;
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
    profile_picture_url?: string;
    updated_at: string;
  };
  message: string;
}

interface UpdateProfileError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateProfileResponse,
    UpdateProfileError,
    ProfileFormData
  >({
    mutationFn: async (formData: ProfileFormData) => {
      const response = await fetch("/api/subscriber/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user data queries
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      queryClient.invalidateQueries({ queryKey: ["subscriber-user"] });
      queryClient.cancelQueries({ queryKey: ["user-data"] });
      queryClient.refetchQueries({ queryKey: ["user-data"] });
      queryClient.refetchQueries({ queryKey: ["subscriber-user"] });
      queryClient.cancelQueries({ queryKey: ["subscriber-user"] });
      queryClient.refetchQueries({ queryKey: ["subscriber-user"] });
    },
  });
};

export interface AccountantData {
  accountantProfile: AccountantProfile;
  userProfile: UserProfile;
}

export interface AccountantResponse {
  success: boolean;
  data: AccountantData;
}

/**
 * Custom hook for fetching accountant profile by accountant ID.
 *
 * This hook fetches both the accountant profile and associated user profile
 * for a specific accountant ID.
 *
 * @param accountantId - The ID of the accountant to fetch
 * @example
 * ```tsx
 * function AccountantDetails({ accountantId }: { accountantId: string }) {
 *   const { data, isLoading, error } = useAccountantProfile(accountantId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return <div>No accountant data</div>;
 *
 *   return (
 *     <div>
 *       <h1>{data.userProfile.first_name} {data.userProfile.last_name}</h1>
 *       <p>Specialization: {data.accountantProfile.specialization}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAccountantProfile = (accountantId: string | undefined) => {
  return useQuery<AccountantResponse>({
    queryKey: ["accountant-profile", accountantId],
    queryFn: async () => {
      if (!accountantId) {
        throw new Error("Accountant ID is required");
      }

      const response = await fetch(`/api/accountant/${accountantId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch accountant profile"
        );
      }

      return response.json();
    },
    enabled: !!accountantId,
    retry: (failureCount, error) => {
      if (error?.message?.includes("Accountant profile not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
