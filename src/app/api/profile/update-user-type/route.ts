import { NextResponse } from "next/server";
import {
  getCurrentUserServer,
} from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { userType } = await request.json();

    if (!userType || !["Subscriber", "Accountant"].includes(userType)) {
      return NextResponse.json(
        { error: "Invalid user type. Must be 'Subscriber' or 'Accountant'" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profile")
      .select("id")
      .eq("id", user.id)
      .limit(1);

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (existingProfile && existingProfile.length > 0) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("user_profile")
        .update({ user_type: userType })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        return NextResponse.json(
          { error: "Failed to update user type" },
          { status: 500 }
        );
      }
    } else {
      // Create new profile with user type
      const { error: insertError } = await supabase
        .from("user_profile")
        .insert({
          id: user.id,
          email: user.email,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    // Update user metadata in auth.users
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        user_type: userType,
      }
    });

    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      return NextResponse.json(
        { error: "Failed to update user metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userType,
      message: "User type updated successfully",
    });
  } catch (error) {
    console.error("Error updating user type:", error);
    return NextResponse.json(
      { error: "Failed to update user type" },
      { status: 500 }
    );
  }
}
