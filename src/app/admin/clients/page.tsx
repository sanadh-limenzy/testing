import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientsPageClient } from "./ClientsPageClient";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  currentPlan: string;
  planStatus: "active" | "inactive";
  referredBy: string;
  status: "active" | "inactive";
  businessName?: string;
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
  isSubscriptionActive: boolean;
  planStartDate?: string;
  planEndDate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: PaginationInfo;
}

async function getClients(page: number = 1): Promise<ClientsResponse> {
  const supabase = await createServerSupabaseClient();
  const limit = 15;
  const offset = (page - 1) * limit;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('user_profile')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile || userProfile.user_type !== 'Admin') {
    throw new Error("Forbidden");
  }

  // Build base query for count
  const baseQuery = supabase
    .from('user_profile')
    .select('*', { count: 'exact', head: true })
    .eq('user_type', 'Subscriber');

  // Get total count
  const { count: totalCount, error: countError } = await baseQuery;

  if (countError) {
    throw new Error("Failed to get total count");
  }

  // Build main query
  const mainQuery = supabase
    .from('user_profile')
    .select(`
      *,
      subscriber_profile (
        business_name,
        legal_business_name,
        plan_id,
        plan_start_date,
        plan_end_date,
        is_subscription_active,
        is_free_subscription_active,
        plans!fk_subscriber_profile_plan (
          id,
          plan_type,
          title,
          description
        )
      )
    `)
    .eq('user_type', 'Subscriber')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: users, error: usersError } = await mainQuery;

  if (usersError) {
    throw new Error("Failed to fetch users");
  }

  // Transform the data
  const transformedUsers = users?.map((user) => {
    const subscriberProfile = user.subscriber_profile?.[0];
    const plan = subscriberProfile?.plans;
    
    const addedOn = new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    let currentPlan = "No Plan";
    if (plan) {
      if (plan.plan_type === 'Premium') {
        currentPlan = "Premium (Done For You)";
      } else if (plan.plan_type === 'Plus') {
        currentPlan = "Plus (Done With You)";
      } else if (plan.plan_type === 'Basic') {
        currentPlan = "Basic (Self-Service)";
      } else {
        currentPlan = plan.title || plan.plan_type;
      }
    }

    const planStatus = subscriberProfile?.is_subscription_active || subscriberProfile?.is_free_subscription_active 
      ? "active" 
      : "inactive";

    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      phoneCode: user.phone_code || '+1',
      addedOn,
      currentPlan,
      planStatus,
      referredBy: user.referred_by || '--',
      status: user.is_active ? 'active' : 'inactive',
      businessName: subscriberProfile?.business_name || subscriberProfile?.legal_business_name,
      userType: user.user_type,
      isActive: user.is_active,
      isSubscriptionActive: subscriberProfile?.is_subscription_active || false,
      planStartDate: subscriberProfile?.plan_start_date,
      planEndDate: subscriberProfile?.plan_end_date
    };
  }) || [];

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return {
    success: true,
    data: transformedUsers as Client[],
    pagination: {
      page,
      limit,
      totalCount: totalCount || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

export default async function AdminClientsPage() {
  const clientsData = await getClients();

  return (
    <ClientsPageClient 
      initialClients={clientsData.data}
      initialPagination={clientsData.pagination}
    />
  );
}