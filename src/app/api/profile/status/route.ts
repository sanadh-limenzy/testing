import { NextResponse } from "next/server";
import {
  getCurrentUserFromToken,
  getCurrentUserServer,
} from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let user = await getCurrentUserServer();
    const headersList = await headers();
    if (!user) {
      const token = headersList.get("Authorization")?.split(" ")[1];
      user = await getCurrentUserFromToken(token ?? "");
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: userAddresses, error: addressError } = await supabase
      .from("user_addresses")
      .select("id, address_type")
      .eq("created_by", user.id)
      .eq("is_deleted", false)
      .limit(10);

    if (addressError) {
      console.error("Error fetching user addresses:", addressError);
    }

    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("id", user.id)
      .limit(1).single();

    if (userProfileError) {
      console.error("Error fetching user profile:", userProfileError);
    }

    const { data: businessData, error: businessError } = await supabase
      .from("subscriber_profile")
      .select("*")
      .eq("user_id", user.id)
      .limit(1).single();

    if (businessError) {
      console.error("Error fetching business info:", businessError);
    }

    const hasUserProfile = userProfileData ? true : false;
    const userType = userProfileData?.user_type;

    console.log(userType, "userProfileData");

    // If user doesn't have a user type set, profile is not complete
    if (!userType) {
      console.log("User type not found");
      return NextResponse.json({
        isProfileComplete: false,
        hasUserProfile,
        hasPersonalAddress: false,
        hasRentalAddress: false,
        hasBusinessAddress: false,
        hasBusinessInfo: false,
        userType: null,
      });
    }

    // Only check additional requirements for Subscriber user type
    if (userType === "Subscriber") {
      console.log("Subscriber user type");
      const hasRentalAddress =
        userAddresses?.some((addr) => addr.address_type === "rental") || false;
      const hasBusinessAddress =
        userAddresses?.some((addr) => addr.address_type === "business") ||
        false;
      const hasBusinessInfo = businessData ? true : false;

      const isProfileComplete =
        hasUserProfile &&
        hasRentalAddress &&
        hasBusinessInfo &&
        hasBusinessAddress;

      const response = {
        isProfileComplete,
        hasUserProfile,
        hasRentalAddress,
        hasBusinessAddress,
        hasBusinessInfo,
        userType,
      };
      console.log(response, "response from route");

      return NextResponse.json(response);
    } else {
      console.log("Non-Subscriber user type");
      // For non-Subscriber users, profile is complete if they have basic profile info
      const isProfileComplete = hasUserProfile;

      return NextResponse.json({
        isProfileComplete,
        hasUserProfile,
        hasPersonalAddress: true, // Not required for non-subscribers
        hasRentalAddress: true, // Not required for non-subscribers
        hasBusinessAddress: true, // Not required for non-subscribers
        hasBusinessInfo: true, // Not required for non-subscribers
        userType,
      });
    }
  } catch (error) {
    console.error("Error checking profile status:", error);
    return NextResponse.json(
      { error: "Failed to check profile status" },
      { status: 500 }
    );
  }
}
