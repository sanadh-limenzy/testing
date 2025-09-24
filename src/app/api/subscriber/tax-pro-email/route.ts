import { getCurrentUserServer } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { z } from "zod";

// Validation schema for the tax pro email request
const taxProEmailSchema = z.object({
  email: z.email("Invalid email format"),
});

export async function POST(request: Request) {
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
    const validatedData = taxProEmailSchema.parse(body);
    const { email } = validatedData;

    // Check if user is a subscriber
    const { data: userProfile, error: userProfileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (userProfile.user_type !== "Subscriber") {
      return NextResponse.json(
        { error: "Only subscribers can set tax pro email" },
        { status: 403 }
      );
    }

    // Check if accountant with this email already exists
    const { data: existingAccountant, error: accountantError } = await supabase
      .from("user_profile")
      .select(`
        id,
        email,
        user_type,
        accountant_profile(id)
      `)
      .eq("email", email)
      .eq("user_type", "Accountant")
      .single();

    if (accountantError && accountantError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if no accountant exists
      console.error("Error checking for existing accountant:", accountantError);
      return NextResponse.json(
        { error: "Failed to check for existing accountant" },
        { status: 500 }
      );
    }

    let accountantId: string;

    if (existingAccountant && existingAccountant.accountant_profile) {
      // Accountant exists, use their accountant_profile.id
      const accountantProfile = existingAccountant.accountant_profile as { id: string }[];
      accountantId = accountantProfile[0].id;
    } else {
      // Accountant doesn't exist, create new user and accountant profile
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();

      // Create user in auth.users using service role
      const serviceSupabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
          cookies: {
            getAll() { return []; },
            setAll() {},
          },
        }
      );

      const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata:{
          first_name: "Tax",
          last_name: "Pro",
          user_type: "Accountant",
        }
      });

      if (authError || !authUser.user) {
        console.error("Error creating auth user:", authError);
        return NextResponse.json(
          { error: "Failed to create tax pro user" },
          { status: 500 }
        );
      }

      // Create user_profile
      const { data: newUserProfile, error: userProfileCreateError } = await supabase
        .from("user_profile")
        .insert({
          id: authUser.user.id,
          email,
          user_type: "Accountant",
          is_email_verified: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (userProfileCreateError || !newUserProfile) {
        console.error("Error creating user profile:", userProfileCreateError);
        return NextResponse.json(
          { error: "Failed to create tax pro profile" },
          { status: 500 }
        );
      }

      // Create accountant_profile
      const { data: newAccountantProfile, error: accountantCreateError } = await supabase
        .from("accountant_profile")
        .insert({
          user_id: newUserProfile.id,
          business_name: `Tax Pro - ${email}`,
          request_accepted: true,
          invited_by_admin: true,
        })
        .select("id")
        .single();

      if (accountantCreateError || !newAccountantProfile) {
        console.error("Error creating accountant profile:", accountantCreateError);
        return NextResponse.json(
          { error: "Failed to create accountant profile" },
          { status: 500 }
        );
      }

      accountantId = newAccountantProfile.id;
    }

    // Update subscriber's accountant_id
    const { error: updateError } = await supabase
      .from("subscriber_profile")
      .update({ accountant_id: accountantId })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscriber profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update tax pro assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tax pro email set successfully",
      accountantId,
    });

  } catch (error) {
    console.error("Unexpected error in tax-pro-email API:", error);

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
