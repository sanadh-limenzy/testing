import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Get current session and refresh user_role cookie
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user (authenticates with Supabase Auth server)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    // Get session for token info
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Fetch user profile to get user_type
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("id, email, user_type, first_name, last_name, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Refresh user_role cookie
    const cookieStore = await cookies();
    cookieStore.set("user_role", userProfile.user_type, {
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
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
        } : null,
        profile: {
          id: userProfile.id,
          email: userProfile.email,
          user_type: userProfile.user_type,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          is_active: userProfile.is_active,
        },
      },
    });
  } catch (error) {
    console.error("Unexpected error in session API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

