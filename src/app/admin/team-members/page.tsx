import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamMembersPageClient } from "./TeamMembersPageClient";
import { getPermissionLevel, AdminProfile } from "@/lib/permission-utils";

interface TeamMember {
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
  permissionLevel: "Super Admin" | "Full Access" | "Limited Access";
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

interface TeamMembersResponse {
  success: boolean;
  data: TeamMember[];
  pagination: PaginationInfo;
}

async function getTeamMembers(page: number = 1): Promise<TeamMembersResponse> {
  const supabase = await createServerSupabaseClient();
  const limit = 15;
  const offset = (page - 1) * limit;

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

  // Build base query for count
  const baseQuery = supabase
    .from("user_profile")
    .select("*", { count: "exact", head: true })
    .eq("user_type", "Admin");

  // Get total count
  const { count: totalCount, error: countError } = await baseQuery;

  if (countError) {
    throw new Error("Failed to get total count");
  }

  // Build main query
  const mainQuery = supabase
    .from("user_profile")
    .select(
      `
      *,
      admin_profile (
        company_position,
        is_super_admin,
        allow_all_access,
        show_valuation_queue,
        show_clients,
        show_affiliates,
        show_vendors,
        show_documents,
        show_transactions,
        show_accountants,
        show_promocodes,
        show_feedback,
        show_education,
        show_reviews,
        show_records,
        show_referrals
      )
    `
    )
    .eq("user_type", "Admin")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: users, error: usersError } = await mainQuery;

  if (usersError) {
    throw new Error("Failed to fetch users");
  }

  // Transform the data
  const transformedUsers =
    users?.map((user) => {
      const adminProfile = user.admin_profile;

      const addedOn = new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Create admin profile object for permission calculation
      const adminProfileData: AdminProfile | null = adminProfile
        ? {
            is_super_admin: adminProfile.is_super_admin || false,
            allow_all_access: adminProfile.allow_all_access || false,
            permission: {
              show_valuation_queue: adminProfile.show_valuation_queue || false,
              show_clients: adminProfile.show_clients || false,
              show_affiliates: adminProfile.show_affiliates || false,
              show_vendors: adminProfile.show_vendors || false,
              show_documents: adminProfile.show_documents || false,
              show_transactions: adminProfile.show_transactions || false,
              show_accountants: adminProfile.show_accountants || false,
              show_promocodes: adminProfile.show_promocodes || false,
              show_feedback: adminProfile.show_feedback || false,
              show_education: adminProfile.show_education || false,
              show_reviews: adminProfile.show_reviews || false,
              show_records: adminProfile.show_records || false,
              show_referrals: adminProfile.show_referrals || false,
            },
          }
        : null;

      return {
        id: user.id,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email,
        phone: user.phone || "",
        phoneCode: user.phone_code || "+1",
        addedOn,
        companyPosition: adminProfile?.company_position,
        isSuperAdmin: adminProfile?.is_super_admin || false,
        allowAllAccess: adminProfile?.allow_all_access || false,
        permissionLevel: getPermissionLevel(adminProfileData),
        status: user.is_active ? "active" : "inactive",
        userType: user.user_type,
        isActive: user.is_active,
      };
    }) || [];

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return {
    success: true,
    data: transformedUsers as TeamMember[],
    pagination: {
      page,
      limit,
      totalCount: totalCount || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export default async function AdminTeamMembersPage() {
  const teamMembersData = await getTeamMembers();

  return (
    <TeamMembersPageClient
      initialTeamMembers={teamMembersData.data}
      initialPagination={teamMembersData.pagination}
    />
  );
}
