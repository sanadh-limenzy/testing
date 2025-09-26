import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Default notification settings
    const defaultSettings = {
      pre_event_email_notifications: true,
      during_event_email_notifications: true,
      post_event_email_notifications: true,
      high_upcoming_rental_event_price: true,
      using_the_app_tax_pro: true,
      tax_code_questions: true,
      annual_filing: true,
      best_practices_posts: true,
      money_savings_posts: true,
      tax_law_posts: true,
      time_savings_posts: true,
    };

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings to defaults
      result = await supabase
        .from("user_notification_settings")
        .update({
          ...defaultSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Create new settings with defaults
      result = await supabase
        .from("user_notification_settings")
        .insert({
          user_id: user.id,
          ...defaultSettings,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error resetting notification settings:", result.error);
      return NextResponse.json(
        { error: "Failed to reset notification settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Notification settings reset to default successfully",
    });
  } catch (error) {
    console.error("Error in notification settings reset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
