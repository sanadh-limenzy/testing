import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

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

    // Fetch rental properties for the client
    const { data: rentalProperties, error: addressError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('created_by', id)
      .eq('address_type', 'rental')
      .eq('is_deleted', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (addressError) {
      console.error("Error fetching rental properties:", addressError);
      return NextResponse.json(
        { error: "Failed to fetch rental properties" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rentalProperties || [],
    });

  } catch (error) {
    console.error("Error in rental properties API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

