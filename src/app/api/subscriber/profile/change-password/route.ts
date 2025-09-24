import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-server";
import { z } from "zod";

// Validation schema for password change
const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Verify user is a subscriber
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("id, user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (userProfile.user_type !== "Subscriber") {
      return NextResponse.json(
        { error: "Only subscribers can change password through this endpoint" },
        { status: 403 }
      );
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      console.log("\n\n\nError updating password:", updateError, "\n\n\n");

      if (updateError.code === "same_password") {
        return NextResponse.json(
          { error: "New password should be different from the old password" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in change password API:", error);

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
