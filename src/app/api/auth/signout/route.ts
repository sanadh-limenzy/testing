import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Sign out
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Sign out error:", signOutError);
      return NextResponse.json(
        { error: signOutError.message },
        { status: 400 }
      );
    }

    // Delete user_role cookie
    const cookieStore = await cookies();
    cookieStore.delete("user_role");

    return NextResponse.json({
      success: true,
      message: "Sign out successful",
    });
  } catch (error) {
    console.error("Unexpected error in sign out API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

