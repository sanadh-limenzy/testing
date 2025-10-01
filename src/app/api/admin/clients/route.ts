import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    // Build base query
    let baseQuery = supabase
      .from('user_profile')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'Subscriber');

    // Apply filters
    if (status !== 'all') {
      baseQuery = baseQuery.eq('is_active', status === 'active');
    }

    if (search) {
      baseQuery = baseQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
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

    // Get total count with filters
    const { count: totalCount, error: countError } = await baseQuery;

    if (countError) {
      console.error('Error getting total count:', countError);
      return NextResponse.json({ error: "Failed to get total count" }, { status: 500 });
    }

    // Build main query with same filters
    let mainQuery = supabase
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
      .eq('user_type', 'Subscriber');

    // Apply same filters
    if (status !== 'all') {
      mainQuery = mainQuery.eq('is_active', status === 'active');
    }

    if (search) {
      mainQuery = mainQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
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
    if (sortBy === 'addedOn') {
      mainQuery = mainQuery.order('created_at', { ascending });
    } else if (sortBy === 'name') {
      mainQuery = mainQuery.order('first_name', { ascending });
    }

    // Apply pagination
    const { data: users, error: usersError } = await mainQuery.range(offset, offset + limit - 1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Transform the data to match our frontend interface
    const transformedUsers = users?.map((user) => {
      const subscriberProfile = user.subscriber_profile?.[0];
      const plan = subscriberProfile?.plans;
      
      // Format the date
      const addedOn = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Determine current plan description
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

      // Determine plan status
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

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error in admin clients API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('user_profile')
      .update({ is_active: status === 'active' })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User status updated successfully"
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
