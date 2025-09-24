import { getCurrentUserServer } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const user = await getCurrentUserServer();

  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", user.id)
    .limit(1)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }

  if (userProfile.user_type === "Subscriber") {
    const { data: subscriberProfile, error: subscriberProfileError } =
      await supabase
        .from("subscriber_profile")
        .select(
          "*,  accountant_profile:accountant_id ( *, user_profile:user_id (*)), reimbursement_plan: reimbursement_plan_id (*)"
        )
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (subscriberProfileError) {
      console.error(
        "Error fetching subscriber profile:",
        subscriberProfileError
      );
    }

    if (!subscriberProfile) {
      console.error("Subscriber profile not found");
    }

    return NextResponse.json({ userProfile, subscriberProfile });
  }

  if (userProfile.user_type === "Accountant") {
    const { data: accountantProfile, error: accountantProfileError } =
      await supabase
        .from("accountant_profile")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (accountantProfileError) {
      console.error(
        "Error fetching accountant profile:",
        accountantProfileError
      );
    }

    return NextResponse.json({ userProfile, accountantProfile });
  }

  return NextResponse.json({ userProfile });
}
