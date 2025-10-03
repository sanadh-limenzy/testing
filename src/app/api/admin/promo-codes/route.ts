import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper function to validate email addresses
function validateEmails(emails: string[]): { isValid: boolean; invalidEmails: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((email) => !emailRegex.test(email));
  return {
    isValid: invalidEmails.length === 0,
    invalidEmails,
  };
}
import { format, isValid } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build query with junction table data
    let query = supabase
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
      .order("created_at", { ascending: false });

    // Apply filters
    if (status !== "all") {
      const now = new Date().toISOString();
      if (status === "active") {
        query = query
          .eq("is_active", true)
          .eq("is_delete", false)
          .or(`expire_at.is.null,expire_at.gt.${now}`);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      } else if (status === "expired") {
        query = query
          .eq("is_active", true)
          .lt("expire_at", now);
      }
    }

    // Always exclude deleted promo codes
    query = query.eq("is_delete", false);

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    // Get total count for pagination (apply same filters as main query)
    let countQuery = supabase
      .from("promo_codes")
      .select("*", { count: "exact", head: true });

    // Apply same filters to count query
    if (status !== "all") {
      const now = new Date().toISOString();
      if (status === "active") {
        countQuery = countQuery
          .eq("is_active", true)
          .eq("is_delete", false)
          .or(`expire_at.is.null,expire_at.gt.${now}`);
      } else if (status === "inactive") {
        countQuery = countQuery.eq("is_active", false);
      } else if (status === "expired") {
        countQuery = countQuery
          .eq("is_active", true)
          .lt("expire_at", now);
      }
    }

    // Always exclude deleted promo codes
    countQuery = countQuery.eq("is_delete", false);

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error getting count:", countError);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: promoCodes, error: promoCodesError } = await query;

    if (promoCodesError) {
      console.error("Error fetching promo codes:", promoCodesError);
      return NextResponse.json(
        { error: "Failed to fetch promo codes" },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      data: transformedPromoCodes,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in promo codes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profile")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      code,
      promo_type,
      is_flat_discount,
      discount_amount,
      discount_percent,
      start_at,
      expire_at,
      no_of_promo_allow_to_used,
      is_one_time_user,
      is_unlimited_promo,
      promo_for,
      allowed_emails,
    } = body;

    // Validate required fields
    if (!name || !code || !start_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email addresses if provided
    if (allowed_emails && allowed_emails.length > 0) {
      const { isValid, invalidEmails } = validateEmails(allowed_emails);
      
      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate discount fields
    if (is_flat_discount && !discount_amount) {
      return NextResponse.json(
        { error: "Discount amount is required for flat discount" },
        { status: 400 }
      );
    }

    if (!is_flat_discount && !discount_percent) {
      return NextResponse.json(
        { error: "Discount percent is required for percentage discount" },
        { status: 400 }
      );
    }

    // Check if code already exists (case-insensitive)
    const { data: existingCode } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code.toLowerCase())
      .eq("is_delete", false)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }

    // Create promo code (store code in lowercase)
    const { data: newPromoCode, error: createError } = await supabase
      .from("promo_codes")
      .insert({
        name,
        code: code.toLowerCase(), // Store in lowercase
        promo_type: promo_type || "All",
        is_flat_discount: is_flat_discount || false,
        discount_amount,
        discount_percent,
        start_at,
        expire_at,
        no_of_promo_allow_to_used,
        is_one_time_user: is_one_time_user || false,
        is_unlimited_promo: is_unlimited_promo || false,
        is_active: true,
        is_delete: false,
        used_by_count: 0,
        created_by: user.id,
        promo_for:allowed_emails
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating promo code:", createError);
      return NextResponse.json(
        { error: "Failed to create promo code" },
        { status: 500 }
      );
    }

    // Create allowed plans relationships
    if (promo_for && promo_for.length > 0) {
      const allowedPlansData = promo_for.map((planId: string) => ({
        promo_code_id: newPromoCode.id,
        plan_id: planId,
      }));

      const { error: allowedPlansError } = await supabase
        .from("promo_code_allowed_plans")
        .insert(allowedPlansData);

      if (allowedPlansError) {
        console.error("Error creating allowed plans:", allowedPlansError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Create allowed emails relationships (for Individual promo codes)
    if (allowed_emails && allowed_emails.length > 0) {
      // Note: This would require a separate table for allowed emails
      // For now, we'll store this in the promo_for field as a workaround
      // In a real implementation, you'd create a promo_code_allowed_emails table
    }

    return NextResponse.json({
      success: true,
      data: newPromoCode,
    });
  } catch (error) {
    console.error("Error in create promo code API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
