import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TaxProsPageClient } from "./TaxProsPageClient";

interface TaxPro {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  companyPosition?: string;
  isSuperAdmin: boolean;
  allowAllAccess: boolean;
  status: "active" | "inactive";
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TaxProsResponse {
  success: boolean;
  data: TaxPro[];
  pagination: PaginationInfo;
}

async function getTaxPros(page: number = 1): Promise<TaxProsResponse> {
  const supabase = await createServerSupabaseClient();
  const limit = 15;
  const offset = (page - 1) * limit;

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
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
    .eq('user_type', 'Accountant');

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
      admin_profile (
        company_position,
        is_super_admin,
        allow_all_access
      )
    `)
    .eq('user_type', 'Accountant')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: users, error: usersError } = await mainQuery;

  if (usersError) {
    throw new Error("Failed to fetch users");
  }

  // Transform the data
  const transformedUsers = users?.map((user) => {
    const adminProfile = user.admin_profile?.[0];
    
    const addedOn = new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email,
      phone: user.phone || '',
      phoneCode: user.phone_code || '+1',
      addedOn,
      companyPosition: adminProfile?.company_position,
      isSuperAdmin: adminProfile?.is_super_admin || false,
      allowAllAccess: adminProfile?.allow_all_access || false,
      status: user.is_active ? 'active' : 'inactive',
      userType: user.user_type,
      isActive: user.is_active,
    };
  }) || [];

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return {
    success: true,
    data: transformedUsers as TaxPro[],
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

export default async function AdminTaxProsPage() {
  const taxProsData = await getTaxPros();

  return (
    <TaxProsPageClient 
      initialTaxPros={taxProsData.data}
      initialPagination={taxProsData.pagination}
    />
  );
}
