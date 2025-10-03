import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PromoCodesPageClient } from "./PromoCodesPageClient";
import { PromoCodeDatabase } from "@/@types";
import { format, isValid } from "date-fns";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type PromoCode = PromoCodeDatabase & {
  formatted_start_date: string;
  formatted_end_date: string;
};

interface PromoCodesData {
  success: boolean;
  data: PromoCode[];
  pagination: PaginationInfo;
}

export default async function PromoCodesPage() {
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

  // Fetch initial promo codes data
  const page = 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  // Build main query
  const mainQuery = supabase
    .from("promo_codes")
    .select(`
      *,
      promo_code_allowed_plans (
        id,
        plan_id,
        plans (
          id,
          plan_type,
          title
        )
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: promoCodes, error: promoCodesError } = await mainQuery;

  if (promoCodesError) {
    throw new Error("Failed to fetch promo codes");
  }

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from("promo_codes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error("Failed to get count");
  }

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "None";
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return "None";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "None";
    }
  };

  // Transform the data with pre-formatted dates
  const transformedPromoCodes =
    promoCodes?.map((promoCode) => ({
      ...promoCode,
      formatted_start_date: formatDate(promoCode.start_at),
      formatted_end_date: formatDate(promoCode.expire_at),
    })) || [];

  const totalPages = Math.ceil((totalCount || 0) / limit);

  const promoCodesData: PromoCodesData = {
    success: true,
    data: transformedPromoCodes as PromoCode[],
    pagination: {
      page,
      limit,
      totalCount: totalCount || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };

  return (
    <PromoCodesPageClient
      initialPromoCodes={promoCodesData.data as PromoCode[]}
      initialPagination={promoCodesData.pagination}
    />
  );
}
