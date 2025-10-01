import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, user_type } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Sign up with email and password
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: user_type || "Subscriber",
        },
      },
    });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Sign up failed" },
        { status: 400 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("user_profile")
      .insert({
        id: data.user.id,
        email: data.user.email,
        user_type: user_type || "Subscriber",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // Continue anyway as the user is created in auth
    }

    // Set user_role cookie if session exists
    if (data.session) {
      const cookieStore = await cookies();
      cookieStore.set("user_role", user_type || "Subscriber", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            expires_in: data.session.expires_in,
          },
        },
        message: "Sign up successful",
      });
    }

    // If no session (email confirmation required)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: null,
      },
      message: "Sign up successful. Please check your email to confirm your account.",
    });
  } catch (error) {
    console.error("Unexpected error in sign up API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

