import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Fetch total planned events (all events that are not drafts)
    const { count: totalPlannedEvents, error: plannedEventsError } =
      await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_draft", false);

    if (plannedEventsError) {
      console.error("Error fetching planned events:", plannedEventsError);
    }

    // Fetch total completed events
    const { count: totalCompletedEvents, error: completedEventsError } =
      await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_draft", false)
        .eq("is_completed_event", true);

    if (completedEventsError) {
      console.error("Error fetching completed events:", completedEventsError);
    }

    // Get all auth users once for both user count and signup data
    const { data: allAuthUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error("Error fetching auth users:", authUsersError);
    }

    // Filter for Subscriber users
    const subscriberUsers = allAuthUsers?.users.filter((user) => {
      const userType = user.user_metadata?.user_type;
      return userType === "Subscriber";
    }) || [];

    // Fetch current user count (active subscriber users only)
    const currentUserCount = subscriberUsers.filter((user) => {
      // Check if user is active (email confirmed)
      return user.email_confirmed_at;
    }).length;

    // Calculate total profit from completed transactions
    const { data: completedTransactions, error: transactionsError } =
      await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed");

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
    }

    const totalProfitTransactions =
      completedTransactions?.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount?.toString() || "0");
        return sum + amount;
      }, 0) || 0;

    // Fetch signup data for the last 30 days from auth.users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter for Subscriber users created within the last 30 days
    const signupData = subscriberUsers
      .filter((user) => {
        if (!user.created_at) return false;
        const createdAt = new Date(user.created_at);
        return createdAt >= thirtyDaysAgo;
      })
      .map((user) => ({
        created_at: user.created_at!,
      }));

    // Group signups by date
    const signupsByDate: { [key: string]: number } = {};
    
    // Initialize all dates in the range with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateKey = date.toISOString().split("T")[0];
      signupsByDate[dateKey] = 0;
    }

    // Count signups by date
    signupData?.forEach((profile) => {
      const dateKey = profile.created_at.split("T")[0];
      if (signupsByDate[dateKey] !== undefined) {
        signupsByDate[dateKey]++;
      }
    });

    // Convert to array format for the chart
    const signupChartData = Object.entries(signupsByDate).map(
      ([date, count]) => ({
        date,
        signups: count,
      })
    );

    // Calculate week-over-week comparison
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);

    const thisWeekSignups = signupData?.filter((profile) => {
      const createdAt = new Date(profile.created_at);
      return createdAt >= thisWeekStart && createdAt <= now;
    }).length || 0;

    const lastWeekSignups = signupData?.filter((profile) => {
      const createdAt = new Date(profile.created_at);
      return createdAt >= lastWeekStart && createdAt < lastWeekEnd;
    }).length || 0;

    const weekOverWeekChange = thisWeekSignups - lastWeekSignups;

    return NextResponse.json({
      success: true,
      data: {
        totalPlannedEvents: totalPlannedEvents || 0,
        totalCompletedEvents: totalCompletedEvents || 0,
        currentUserCount: currentUserCount || 0,
        totalProfitTransactions: totalProfitTransactions,
        signupChartData,
        weekOverWeekChange,
      },
    });
  } catch (error) {
    console.error("Unexpected error in admin statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
