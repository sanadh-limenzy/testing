import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get pagination and filter parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = (page - 1) * limit;

    // Filter parameters
    const addedDate = searchParams.get("addedDate") || "all";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "addedOn";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    // Build base query for count
    let baseQuery = supabase
      .from("user_profile")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "Accountant");

    // Apply filters for count
    if (status !== "all") {
      baseQuery = baseQuery.eq("is_active", status === "active");
    }

    if (search) {
      baseQuery = baseQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (addedDate !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (addedDate) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      baseQuery = baseQuery.gte("created_at", startDate.toISOString());
    }

    // Get total count
    const { count: totalCount, error: countError } = await baseQuery;

    if (countError) {
      console.error("Error getting count:", countError);
      return NextResponse.json(
        { error: "Failed to get count" },
        { status: 500 }
      );
    }

    // Build main query
    let mainQuery = supabase
      .from("user_profile")
      .select(
        `
        *,
        accountant_profile (
          business_name,
          business_entity_type
        )
      `
      )
      .eq("user_type", "Accountant");

    // Apply filters for main query
    if (status !== "all") {
      mainQuery = mainQuery.eq("is_active", status === "active");
    }

    if (search) {
      mainQuery = mainQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (addedDate !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (addedDate) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      mainQuery = mainQuery.gte("created_at", startDate.toISOString());
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    switch (sortBy) {
      case "name":
        mainQuery = mainQuery.order("first_name", { ascending });
        break;
      case "email":
        mainQuery = mainQuery.order("email", { ascending });
        break;
      case "addedOn":
      default:
        mainQuery = mainQuery.order("created_at", { ascending });
        break;
    }

    // Apply pagination
    mainQuery = mainQuery.range(offset, offset + limit - 1);

    const { data: users, error: usersError } = await mainQuery;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedUsers =
      users?.map((user) => {
        const accountantProfile = user.accountant_profile;

        const addedOn = new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return {
          id: user.id,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email,
          phone: user.phone || "",
          phoneCode: user.phone_code || "+1",
          addedOn,
          businessName: accountantProfile?.business_name,
          businessEntityType: accountantProfile?.business_entity_type,
          status: user.is_active ? "active" : "inactive",
          userType: user.user_type,
          isActive: user.is_active,
        };
      }) || [];

    // No access level filtering for taxpros since they don't have admin permissions
    const filteredUsers = transformedUsers;

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      success: true,
      data: filteredUsers,
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
    console.error("Error in tax pros API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
