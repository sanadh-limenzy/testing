import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CustomPlansResponse,
  CustomPlanWithDetails,
  FilterStatus,
  DatabaseCustomPlan,
  DatabaseResidence,
  DatabaseComp,
  DatabaseUserProfile,
} from "@/@types/custom-plans";
import { UserAddress } from "@/@types";

// Extended database row types for API responses (with string/number flexibility)
interface CustomPlanRow extends DatabaseCustomPlan {
  user_profile: DatabaseUserProfile | DatabaseUserProfile[];
  residences: DatabaseResidence[];
}

// Helpers
function sanitize(input: string): string {
  return input
    .trim()
    .replace(/[<>'"\\]/g, "")
    .slice(0, 100);
}

function parseQuery(searchParams: URLSearchParams) {
  const page = Math.max(
    1,
    Math.min(1000, Number(searchParams.get("page")) || 1)
  );
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 15)
  );
  const search = sanitize(searchParams.get("search") || "");
  const statusRaw = (searchParams.get("status") || "all").toLowerCase();
  const status: FilterStatus = ["all", "active", "inactive"].includes(statusRaw)
    ? (statusRaw as FilterStatus)
    : "all";
  return { page, limit, search, status };
}

async function getUserAndProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized", code: 401 };

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("user_type, is_active")
    .eq("id", user.id)
    .single();

  if (profileError) return { error: "Auth check failed", code: 500 };
  if (!profile || profile.user_type !== "Admin" || !profile.is_active)
    return { error: "Forbidden", code: 403 };

  return { user, profile };
}

function transformPlans(plans: CustomPlanRow[]): CustomPlanWithDetails[] {
  return plans.map((plan) => {
    const profile = Array.isArray(plan.user_profile)
      ? plan.user_profile[0]
      : plan.user_profile;

    const residences = plan.residences || [];
    const totalTarAmount = residences.reduce(
      (sum, r) => sum + Number(r.tar_fee_amount || 0),
      0
    );

    return {
      id: plan.id,
      mongo_id: plan.mongo_id,
      status: plan.status,
      user_id: plan.user_id,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      user_profile: profile
        ? {
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
          }
        : null,
      residences: residences.map((r: DatabaseResidence) => {
        const address = Array.isArray(r.user_addresses)
          ? r.user_addresses[0]
          : r.user_addresses;
        return {
          id: r.id,
          custom_plan_id: r.custom_plan_id,
          nick_name: r.nick_name,
          tar_fee_percent: Number(r.tar_fee_percent),
          event_days: r.event_days,
          tar_fee_amount: Number(r.tar_fee_amount),
          average_value: Number(r.average_value),
          total_value: Number(r.total_value),
          tax_savings: Number(r.tax_savings),
          address_id: r.address_id,
          created_at: r.created_at,
          updated_at: r.updated_at,
          comps: (r.comps || []).map((c: DatabaseComp) => ({
            id: c.id,
            residence_id: c.residence_id,
            daily_rental_amount: Number(c.daily_rental_amount),
            location: c.location,
            distance_from_residence: c.distance_from_residence,
            square_footage: c.square_footage,
            bedrooms: c.bedrooms,
            bathrooms: c.bathrooms,
            website_link: c.website_link,
            file: c.file,
            notes: c.notes,
            is_active: c.is_active,
            created_at: c.created_at,
            updated_at: c.updated_at,
          })),
          address: address
            ? {
                id: address.id,
                mongo_id: address.mongo_id,
                address_type: address.address_type || undefined,
                business_name: address.business_name || undefined,
                business_phone_code: address.business_phone_code || undefined,
                business_phone: address.business_phone || undefined,
                business_email: address.business_email || undefined,
                business_entity_type: address.business_entity_type || undefined,
                business_nature: address.business_nature || undefined,
                is_home_office_deduction: address.is_home_office_deduction || undefined,
                tax_filing_status: address.tax_filing_status || undefined,
                estimated_income: address.estimated_income
                  ? Number(address.estimated_income)
                  : undefined,
                nickname: address.nickname || undefined,
                street: address.street || undefined,
                description: address.description || undefined,
                apartment: address.apartment || undefined,
                county: address.county || undefined,
                city: address.city || undefined,
                state: address.state || undefined,
                zip: address.zip || undefined,
                bedrooms: address.bedrooms || undefined,
                country: address.country || undefined,
                lat: address.lat ? Number(address.lat) : undefined,
                lng: address.lng ? Number(address.lng) : undefined,
                time_zone: address.time_zone || undefined,
                year: address.year || undefined,
                is_default: address.is_default || undefined,
                is_active: address.is_active || undefined,
                is_deleted: address.is_deleted || undefined,
                created_at: address.created_at || undefined,
                updated_at: address.updated_at || undefined,
              } as UserAddress
            : null,
        };
      }),
      total_tar_amount: totalTarAmount,
      residence_count: residences.length,
    };
  });
}

// API handler
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, status } = parseQuery(searchParams);
    const offset = (page - 1) * limit;

    const { error, code } = await getUserAndProfile(supabase);
    if (error)
      return NextResponse.json({ success: false, error }, { status: code });

    let query = supabase
      .from("custom_plans")
      .select(
        `
        id,mongo_id,status,user_id,created_at,updated_at,
        user_profile (first_name,last_name,email),
        residences (
          id,custom_plan_id,nick_name,tar_fee_percent,event_days,
          tar_fee_amount,average_value,total_value,tax_savings,address_id,
          created_at,updated_at,
          user_addresses (*),
          comps (*)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status.toUpperCase());

    const { data, error: queryError } = (await query) as {
      data: CustomPlanRow[] | null;
      error: unknown;
    };
    if (queryError) {
      console.error("Query error:", queryError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    let filtered = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const prof = Array.isArray(p.user_profile)
          ? p.user_profile[0]
          : p.user_profile;
        if (!prof) return false;
        return (
          (prof.first_name || "").toLowerCase().includes(searchLower) ||
          (prof.last_name || "").toLowerCase().includes(searchLower) ||
          (prof.email || "").toLowerCase().includes(searchLower)
        );
      });
    }

    const totalCount = filtered.length;
    const paged = filtered.slice(offset, offset + limit);
    const transformed = transformPlans(paged);

    const response: CustomPlansResponse = {
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    };

    console.log(
      `custom-plans GET took ${Date.now() - start}ms, returned ${
        transformed.length
      } records`
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("Handler error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
