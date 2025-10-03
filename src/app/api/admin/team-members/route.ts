import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPermissionLevel, AdminProfile } from "@/lib/permission-utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get pagination and filter parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const addedDate = searchParams.get('addedDate') || 'all';
    const status = searchParams.get('status') || 'all';
    const accessLevel = searchParams.get('accessLevel') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'addedOn';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.user_type !== 'Admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build base query for count
    let baseQuery = supabase
      .from('user_profile')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'Admin');

    // Apply filters for count
    if (status !== 'all') {
      baseQuery = baseQuery.eq('is_active', status === 'active');
    }

    if (search) {
      baseQuery = baseQuery.or(`first_name.ilike.%${search.trim()}%,last_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    if (addedDate !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (addedDate) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      baseQuery = baseQuery.gte('created_at', startDate.toISOString());
    }

    // Get total count
    const { count: totalCount, error: countError } = await baseQuery;

    if (countError) {
      console.error("Error getting count:", countError);
      return NextResponse.json({ error: "Failed to get count" }, { status: 500 });
    }

    // Build main query
    let mainQuery = supabase
      .from('user_profile')
      .select(`
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
      `)
      .eq('user_type', 'Admin');

    // Apply filters for main query
    if (status !== 'all') {
      mainQuery = mainQuery.eq('is_active', status === 'active');
    }

    if (search) {
      mainQuery = mainQuery.or(`first_name.ilike.%${search.trim()}%,last_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    if (addedDate !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (addedDate) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      mainQuery = mainQuery.gte('created_at', startDate.toISOString());
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    switch (sortBy) {
      case 'name':
        mainQuery = mainQuery.order('first_name', { ascending });
        break;
      case 'email':
        mainQuery = mainQuery.order('email', { ascending });
        break;
      case 'addedOn':
      default:
        mainQuery = mainQuery.order('created_at', { ascending });
        break;
    }

    // Apply pagination
    mainQuery = mainQuery.range(offset, offset + limit - 1);

    const { data: users, error: usersError } = await mainQuery;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Transform the data
    const transformedUsers = users?.map((user) => {
      const adminProfile = user.admin_profile;
      
      const addedOn = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Create admin profile object for permission calculation
      const adminProfileData: AdminProfile | null = adminProfile ? {
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
        }
      } : null;

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
        permissionLevel: getPermissionLevel(adminProfileData),
        status: user.is_active ? 'active' : 'inactive',
        userType: user.user_type,
        isActive: user.is_active,
      };
    }) || [];

    // Apply access level filter after transformation
    let filteredUsers = transformedUsers;
    if (accessLevel !== 'all') {
      filteredUsers = transformedUsers.filter(user => {
        switch (accessLevel) {
          case 'super_admin':
            return user.permissionLevel === 'Super Admin';
          case 'admin':
            return user.permissionLevel === 'Admin';
          case 'employee':
            return user.permissionLevel === 'Employee';
          case 'subscriber':
            return user.permissionLevel === 'Subscriber';
          default:
            return true;
        }
      });
    }

    // Recalculate total count after filtering
    const filteredTotalCount = accessLevel !== 'all' ? filteredUsers.length : (totalCount || 0);
    const totalPages = Math.ceil(filteredTotalCount / limit);

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      pagination: {
        page,
        limit,
        totalCount: filteredTotalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error in team members API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

