import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

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

    // Fetch user notification settings
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching notification settings:", settingsError);
      return NextResponse.json(
        { error: "Failed to fetch notification settings" },
        { status: 500 }
      );
    }

    // If no settings exist, return default values
    if (!notificationSettings) {
      const defaultSettings = {
        id: null,
        user_id: user.id,
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

      return NextResponse.json({
        success: true,
        data: defaultSettings,
      });
    }

    return NextResponse.json({
      success: true,
      data: notificationSettings,
    });
  } catch (error) {
    console.error("Error in notification settings fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Validate the request body
    const allowedFields = [
      "pre_event_email_notifications",
      "during_event_email_notifications",
      "post_event_email_notifications",
      "high_upcoming_rental_event_price",
      "using_the_app_tax_pro",
      "tax_code_questions",
      "annual_filing",
      "best_practices_posts",
      "money_savings_posts",
      "tax_law_posts",
      "time_savings_posts",
    ];

    const updateData: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === "boolean") {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from("user_notification_settings")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Create new settings
      result = await supabase
        .from("user_notification_settings")
        .insert({
          user_id: user.id,
          ...updateData,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error updating notification settings:", result.error);
      return NextResponse.json(
        { error: "Failed to update notification settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    console.error("Error in notification settings update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
