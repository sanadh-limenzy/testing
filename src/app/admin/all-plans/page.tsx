import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AllPlansPageClient } from "./AllPlansPageClient";
import { 
  PaginationInfo, 
  DatabaseCustomPlan, 
  DatabaseResidence, 
  DatabaseComp,
  CustomPlanWithDetails,
  Residence,
  Comp
} from "@/@types/custom-plans";
import { UserAddress } from "@/@types";

// Types are now imported from @/types/custom-plans

async function getCustomPlans(): Promise<{
  data: CustomPlanWithDetails[];
  pagination: PaginationInfo;
}> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("user_profile")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile || userProfile.user_type !== "Admin") {
    throw new Error("Forbidden");
  }

  const page = 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  // Build comprehensive query to fetch all related data in one go
  const baseQuery = supabase.from("custom_plans").select(`
      *,
      user_profile!custom_plans_user_id_fkey (
        first_name,
        last_name,
        email
      ),
      residences (
        *,
        user_addresses!residences_address_id_fkey (
          *
        ),
        comps (
          *
        )
      )
    `);

  // Execute comprehensive query
  const { data: allCustomPlansData, error: queryError } = await baseQuery.order(
    "created_at",
    { ascending: false }
  );

  if (queryError) {
    console.error("Error fetching custom plans with related data:", queryError);
    throw new Error("Failed to fetch custom plans");
  }

  // Apply pagination
  const totalCount = allCustomPlansData?.length || 0;
  const paginatedData = allCustomPlansData?.slice(offset, offset + limit) || [];

  // Transform data to match CustomPlanWithDetails interface with all related data
  const transformedData: CustomPlanWithDetails[] = paginatedData.map((plan: DatabaseCustomPlan) => {
    const profile = Array.isArray(plan.user_profile)
      ? plan.user_profile[0]
      : plan.user_profile;
    const residences = Array.isArray(plan.residences) ? plan.residences : [];

    // Calculate aggregates
    const residenceCount = residences.length;
    const totalTarAmount = residences.reduce(
      (sum: number, residence: DatabaseResidence) => sum + parseFloat(residence.tar_fee_amount.toString()),
      0
    );

    return {
      id: plan.id,
      mongo_id: plan.mongo_id,
      status: plan.status,
      user_id: plan.user_id,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      user_profile: profile
        ? {
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
          }
        : null,
      residences: residences.map((residence: DatabaseResidence): Residence => {
        // Handle address data - Supabase returns it as an array even for single relationships
        const addressData = Array.isArray(residence.user_addresses)
          ? residence.user_addresses[0]
          : residence.user_addresses;

        return {
          id: residence.id,
          custom_plan_id: residence.custom_plan_id,
          nick_name: residence.nick_name,
          tar_fee_percent: parseFloat(residence.tar_fee_percent.toString()),
          event_days: residence.event_days,
          tar_fee_amount: parseFloat(residence.tar_fee_amount.toString()),
          average_value: parseFloat(residence.average_value.toString()),
          total_value: parseFloat(residence.total_value.toString()),
          tax_savings: parseFloat(residence.tax_savings.toString()),
          address_id: residence.address_id,
          created_at: residence.created_at,
          updated_at: residence.updated_at,
          comps: Array.isArray(residence.comps)
            ? residence.comps.map((comp: DatabaseComp): Comp => ({
                id: comp.id,
                residence_id: comp.residence_id,
                daily_rental_amount: parseFloat(
                  comp.daily_rental_amount.toString()
                ),
                location: comp.location,
                distance_from_residence: comp.distance_from_residence,
                square_footage: comp.square_footage,
                bedrooms: comp.bedrooms,
                bathrooms: comp.bathrooms,
                website_link: comp.website_link,
                file: comp.file,
                notes: comp.notes,
                is_active: comp.is_active,
                created_at: comp.created_at,
                updated_at: comp.updated_at,
              }))
            : [],
          // Include address data if available
          address: addressData
            ? {
                id: addressData.id,
                mongo_id: addressData.mongo_id,
                address_type: addressData.address_type || undefined,
                business_name: addressData.business_name || undefined,
                business_phone_code: addressData.business_phone_code || undefined,
                business_phone: addressData.business_phone || undefined,
                business_email: addressData.business_email || undefined,
                business_entity_type: addressData.business_entity_type || undefined,
                business_nature: addressData.business_nature || undefined,
                is_home_office_deduction: addressData.is_home_office_deduction || undefined,
                tax_filing_status: addressData.tax_filing_status || undefined,
                estimated_income: addressData.estimated_income
                  ? parseFloat(addressData.estimated_income.toString())
                  : undefined,
                nickname: addressData.nickname || undefined,
                street: addressData.street || undefined,
                description: addressData.description || undefined,
                apartment: addressData.apartment || undefined,
                county: addressData.county || undefined,
                city: addressData.city || undefined,
                state: addressData.state || undefined,
                zip: addressData.zip || undefined,
                bedrooms: addressData.bedrooms || undefined,
                country: addressData.country || undefined,
                lat: addressData.lat
                  ? parseFloat(addressData.lat.toString())
                  : undefined,
                lng: addressData.lng
                  ? parseFloat(addressData.lng.toString())
                  : undefined,
                time_zone: addressData.time_zone || undefined,
                year: addressData.year || undefined,
                is_default: addressData.is_default || undefined,
                is_active: addressData.is_active || undefined,
                is_deleted: addressData.is_deleted || undefined,
                created_at: addressData.created_at || undefined,
                updated_at: addressData.updated_at || undefined,
              } as UserAddress
            : null,
        };
      }),
      total_tar_amount: totalTarAmount,
      residence_count: residenceCount,
    };
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: transformedData,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export default async function AllPlansPage() {
  const { data: customPlans, pagination } = await getCustomPlans();

  return (
    <AllPlansPageClient
      initialCustomPlans={customPlans}
      initialPagination={pagination}
    />
  );
}
