import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-server";
import { z } from "zod";

// Validation schema for the accounts payable email update request
const updateAccountsPayableEmailSchema = z.object({
  accounts_payable_email: z
    .string()
    .refine(
      (email) => {
        // Allow empty string (no emails)
        if (!email.trim()) {
          return true;
        }
        
        // Split by comma and validate each email
        const emails = email.split(",").map(e => e.trim()).filter(e => e.length > 0);
        
        // If there are emails, validate each one
        if (emails.length > 0) {
          return emails.every(e => {
            try {
              z.email().parse(e);
              return true;
            } catch {
              return false;
            }
          });
        }
        
        return true;
      },
      {
        message: "Please provide valid email addresses separated by commas (e.g., user1@email.com, user2@email.com) or leave empty"
      }
    )
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
    const validatedData = updateAccountsPayableEmailSchema.parse(body);

    // Get user profile to verify user type
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

    // Verify user is a subscriber
    if (userProfile.user_type !== "Subscriber") {
      return NextResponse.json(
        { error: "Only subscribers can update accounts payable email" },
        { status: 403 }
      );
    }

    // Check if subscriber profile exists
    const { data: subscriberProfile, error: subscriberError } = await supabase
      .from("subscriber_profile")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();

    if (subscriberError || !subscriberProfile) {
      return NextResponse.json(
        { error: "Subscriber profile not found" },
        { status: 404 }
      );
    }

    // Update accounts payable email in subscriber profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("subscriber_profile")
      .update({
        accounts_payable_email: validatedData.accounts_payable_email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriberProfile.id)
      .select("id, accounts_payable_email, updated_at")
      .single();

    if (updateError) {
      console.error("Error updating accounts payable email:", updateError);
      return NextResponse.json(
        { error: "Failed to update accounts payable email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProfile.id,
        accounts_payable_email: updatedProfile.accounts_payable_email,
        updated_at: updatedProfile.updated_at,
      },
      message: "Accounts payable email updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in update accounts payable email API:", error);

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

// GET endpoint to retrieve current accounts payable email
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get subscriber profile with accounts payable email
    const { data: subscriberProfile, error: subscriberError } = await supabase
      .from("subscriber_profile")
      .select("id, accounts_payable_email")
      .eq("user_id", user.id)
      .single();

    if (subscriberError || !subscriberProfile) {
      return NextResponse.json(
        { error: "Subscriber profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: subscriberProfile.id,
        accounts_payable_email: subscriberProfile.accounts_payable_email || "",
      },
    });
  } catch (error) {
    console.error("Unexpected error in get accounts payable email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
