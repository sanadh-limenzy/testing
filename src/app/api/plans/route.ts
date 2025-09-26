import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true);

  if (plansError) {
    return NextResponse.json({ error: plansError.message }, { status: 500 });
  }

  return NextResponse.json({ plans });
}
