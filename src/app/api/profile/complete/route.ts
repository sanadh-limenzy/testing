import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserAddress } from "@/@types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userProfile, personalAddress, rentalAddresses, businessData } =
      body;

    const user = await getCurrentUserServer();

    const supabase = await createServerSupabaseClient();

    if (userProfile) {
      const { error: userProfileError } = await supabase
        .from("user_profile")
        .upsert({
          id: user?.id ?? "",
          first_name: userProfile.firstName,
          last_name: userProfile.lastName,
          email: userProfile.email,
          updated_at: new Date().toISOString(),
          user_type: "Subscriber",
        });

      if (userProfileError) {
        console.error("Error saving user profile:", userProfileError);
        throw new Error("Failed to save user profile");
      }

      // Update user metadata in auth.users
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          user_type: "Subscriber",
          first_name: userProfile.firstName,
          last_name: userProfile.lastName,
          full_name: `${userProfile.firstName} ${userProfile.lastName}`,
        },
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError);
        throw new Error("Failed to update user metadata");
      }
    }

    if (personalAddress) {
      const { error: addressError } = await supabase
        .from("user_profile")
        .insert({
          street: personalAddress.street,
          city: personalAddress.city,
          state: personalAddress.state,
          zip: personalAddress.zipCode,
          country: personalAddress.country,
          lat: personalAddress.latitude,
          lng: personalAddress.longitude,
        });

      if (addressError) {
        console.error("Error saving personal address:", addressError);
        throw new Error("Failed to save personal address");
      }
    }

    if (rentalAddresses && rentalAddresses.length > 0) {
      const rentalAddressesData = rentalAddresses.map(
        (rentalAddress: UserAddress) => ({
          created_by: user?.id ?? "",
          address_type: "rental",
          street: rentalAddress.street,
          city: rentalAddress.city,
          state: rentalAddress.state,
          zip: rentalAddress.zip,
          country: rentalAddress.country,
          lat: rentalAddress.lat,
          lng: rentalAddress.lng,
          is_default: false,
          is_active: true,
          is_deleted: false,
        })
      );

      const { error: rentalError } = await supabase
        .from("user_addresses")
        .insert(rentalAddressesData);

      if (rentalError) {
        console.error("Error saving rental addresses:", rentalError);
        throw new Error("Failed to save rental addresses");
      }
    }

    // Save business information
    if (businessData) {
      const { error: businessError } = await supabase
        .from("subscriber_profile")
        .insert({
          user_id: user?.id ?? "",
          business_name: businessData.businessName,
          business_email: businessData.businessEmail,
          business_entity_type: businessData.entityType,
          business_nature: businessData.natureOfBusiness,
        });

      if (businessError) {
        console.error("Error saving business information:", businessError);
        throw new Error("Failed to save business information");
      }
    }

    // Save business address
    if (businessData && businessData.businessStreet) {
      const { error: businessAddressError } = await supabase
        .from("user_addresses")
        .insert({
          created_by: user?.id ?? "",
          address_type: "business",
          street: businessData.businessStreet,
          city: businessData.businessCity,
          state: businessData.businessState,
          zip: businessData.businessZipCode,
          country: businessData.businessCountry,
          lat: businessData.businessLatitude,
          lng: businessData.businessLongitude,
          is_default: true,
          is_active: true,
          is_deleted: false,
        });

      if (businessAddressError) {
        console.error("Error saving business address:", businessAddressError);
        throw new Error("Failed to save business address");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing profile:", error);
    return NextResponse.json(
      { error: "Failed to save information" },
      { status: 500 }
    );
  }
}
