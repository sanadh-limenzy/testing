import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TransactionsPageClient } from "./TransactionsPageClient";
import { TransactionDatabase } from "@/@types";
import { UserProfile } from "@/@types/user";
import { format, isValid } from "date-fns";

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type Transaction = TransactionDatabase & {
  user_profile: Pick<UserProfile, "id" | "first_name" | "last_name" | "email">;
  formatted_date: string;
};

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TransactionsData {
  success: boolean;
  data: Transaction[];
  users: User[];
  pagination: PaginationInfo;
}

export default async function TransactionsPage() {
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

  // Fetch initial transactions data
  const page = 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  // Build main query
  const mainQuery = supabase
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
    )
    .order("transaction_date", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: transactions, error: transactionsError } = await mainQuery;

  if (transactionsError) {
    throw new Error("Failed to fetch transactions");
  }

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error("Failed to get count");
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
  const transformedTransactions =
    transactions?.map((transaction) => ({
      ...transaction,
      formatted_date: formatDate(transaction.transaction_date),
    })) || [];

  // Fetch users for client dropdown
  const { data: users, error: usersError } = await supabase
    .from("user_profile")
    .select("id, first_name, last_name, email")
    .order("first_name", { ascending: true });

  if (usersError) {
    console.error("Error fetching users:", usersError);
  }

  const totalPages = Math.ceil((totalCount || 0) / limit);

  const transactionsData: TransactionsData = {
    success: true,
    data: transformedTransactions as Transaction[],
    users: users || [],
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
    <TransactionsPageClient
      initialTransactions={transactionsData.data as Transaction[]}
      initialPagination={transactionsData.pagination}
      initialUsers={transactionsData.users}
    />
  );
}
