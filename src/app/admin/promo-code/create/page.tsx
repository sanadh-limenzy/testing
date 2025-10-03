import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreatePromoCodeForm } from "@/components/admin/CreatePromoCodeForm";

export default async function CreatePromoCodePage() {
  const supabase = await createServerSupabaseClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profile")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile || userProfile.user_type !== "Admin") {
    throw new Error("Forbidden");
  }

  // Fetch active plans
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("id, plan_type, title")
    .eq("is_active", true)
    .order("plan_type", { ascending: true });

  if (plansError) {
    console.error("Error fetching plans:", plansError);
  }

  return <CreatePromoCodeForm initialPlans={plans || []} />;
}
