import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { format, isValid } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get pagination and filter parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const offset = (page - 1) * limit;

    // Filter parameters
    const client = searchParams.get("client") || "all";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

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
      .from("transactions")
      .select("*", { count: "exact", head: true });

    // Apply filters for count
    if (client !== "all") {
      baseQuery = baseQuery.eq("user_id", client);
    }

    if (status !== "all") {
      baseQuery = baseQuery.eq("status", status);
    }

    if (search) {
      baseQuery = baseQuery.ilike("transaction_id", `%${search}%`);
    }

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
      .from("transactions")
      .select(
        `
        *,
        user_profile!transactions_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `
      );

    // Apply filters for main query
    if (client !== "all") {
      mainQuery = mainQuery.eq("user_id", client);
    }

    if (status !== "all") {
      mainQuery = mainQuery.eq("status", status);
    }

    if (search) {
      mainQuery = mainQuery.ilike("transaction_id", `%${search}%`);
    }

    // Apply sorting - default to newest first
    mainQuery = mainQuery.order("transaction_date", { ascending: false });

    // Apply pagination
    mainQuery = mainQuery.range(offset, offset + limit - 1);

    const { data: transactions, error: transactionsError } = await mainQuery;

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Helper function to safely format dates
    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) return "-";
      
      try {
        const date = new Date(dateString);
        if (!isValid(date)) return "-";
        return format(date, "MMM d, yyyy");
      } catch (error) {
        console.error("Error formatting date:", error);
        return "-";
      }
    };

    // Transform the data with pre-formatted dates
    const transformedTransactions = transactions?.map((transaction) => ({
      ...transaction,
      formatted_date: formatDate(transaction.transaction_date),
    })) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    // Fetch users for client dropdown
    const { data: users, error: usersError } = await supabase
      .from("user_profile")
      .select("id, first_name, last_name, email")
      .order("first_name", { ascending: true });

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      users: users || [],
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
    console.error("Error in transactions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
