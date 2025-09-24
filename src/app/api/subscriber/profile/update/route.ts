import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-server";
import { z } from "zod";

// Validation schema for the update request
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phoneCode: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const { data: existingProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("id, email, user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user is a subscriber
    if (existingProfile.user_type !== "Subscriber") {
      return NextResponse.json(
        { error: "Only subscribers can update profile through this endpoint" },
        { status: 403 }
      );
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email !== existingProfile.email) {
      const { data: emailExists } = await supabase
        .from("user_profile")
        .select("id")
        .eq("email", validatedData.email)
        .neq("id", existingProfile.id)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_profile")
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        phone_code: validatedData.phoneCode || null,
        phone: validatedData.phone || null,
        street: validatedData.street || null,
        apartment: validatedData.apartment || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        zip: validatedData.zip || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone_code,
        phone,
        street,
        apartment,
        city,
        state,
        zip,
        profile_picture_url,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating subscriber profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update subscriber profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Subscriber profile updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in update subscriber profile API:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
