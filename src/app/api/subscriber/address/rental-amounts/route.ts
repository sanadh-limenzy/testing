import { FutureDailyPricingDay, UserAddress } from "@/@types";
import airdnaUtils from "@/lib/airdna-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.info(`[RENTAL_AMOUNTS] Starting request processing`);

  try {
    const supabase = await createServerSupabaseClient();
    const args = request.nextUrl.searchParams;

    const rental_address_id = args.get("rental_address_id");
    const selected_year =
      args.get("selected_year") || new Date().getFullYear().toString();

    console.info(
      `[RENTAL_AMOUNTS] Processing request - rental_address_id: ${rental_address_id}, selected_year: ${selected_year}`
    );

    // Auth check
    const {
      data: { user },
      error: auth_error,
    } = await supabase.auth.getUser();

    if (auth_error || !user) {
      console.error(
        `[RENTAL_AMOUNTS] Authentication failed:`,
        auth_error?.message || "No user found"
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.info(`[RENTAL_AMOUNTS] User authenticated: ${user.id}`);

    // Get subscriber profile
    const { data: subscriber_profile, error: subscriber_profile_error } =
      await supabase
        .from("subscriber_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (subscriber_profile_error || !subscriber_profile) {
      console.error(
        `[RENTAL_AMOUNTS] Subscriber profile not found for user ${user.id}:`,
        subscriber_profile_error?.message
      );
      return NextResponse.json(
        { error: "Subscriber profile not found" },
        { status: 404 }
      );
    }

    if (!subscriber_profile.is_digital_valuation_allow) {
      console.warn(
        `[RENTAL_AMOUNTS] Digital valuation not allowed for user ${user.id}`
      );
      return NextResponse.json({ data: [] });
    }

    console.info(
      `[RENTAL_AMOUNTS] Digital valuation allowed for user ${user.id}`
    );

    // Resolve rental address
    let rental_address: UserAddress | null = null;
    if (rental_address_id) {
      const { data: rental_address_data } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("id", rental_address_id)
        .single();
      rental_address = rental_address_data;
    }

    if (!rental_address) {
      const { data: rental_address_data } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("created_by", user.id)
        .eq("address_type", "rental")
        .eq("is_default", true)
        .limit(1)
        .single();
      rental_address = rental_address_data;
    }

    if (!rental_address || !rental_address.zip) {
      console.error(
        `[RENTAL_AMOUNTS] Rental address not found or missing zip code for user ${user.id}, rental_address_id: ${rental_address_id}`
      );
      return NextResponse.json({ data: [] });
    }

    console.info(
      `[RENTAL_AMOUNTS] Found rental address: ${rental_address.id}, zip: ${rental_address.zip}`
    );

    // Get market code
    const { data: market_code_data } = await supabase
      .from("market_codes")
      .select("*")
      .eq("zip", rental_address.zip)
      .single();

    if (!market_code_data) {
      console.error(
        `[RENTAL_AMOUNTS] Market code not found for zip: ${rental_address.zip}`
      );
      return NextResponse.json({ data: [] });
    }

    console.info(
      `[RENTAL_AMOUNTS] Found market code: ${market_code_data.id}, city_id: ${market_code_data.city_id}`
    );

    const future_daily_pricing_params = {
      start_month: 1,
      bedrooms: rental_address.bedrooms || 2,
      room_types: "entire_place",
      number_of_months: 12,
      percentiles: 0.9,
    };

    const year_start = `${selected_year}-01-01T00:00:00.000Z`;
    const year_end = `${parseInt(selected_year) + 1}-01-01T00:00:00.000Z`;

    // Get existing records
    const { data: future_daily_pricing_records } = await supabase
      .from("future_daily_pricing")
      .select("id")
      .eq("market_code_id", market_code_data.id)
      .eq("bedrooms", future_daily_pricing_params.bedrooms)
      .gte("date", year_start)
      .lt("date", year_end);

    let future_daily_pricing_ids: string[] = [];
    let future_daily_pricing_data: FutureDailyPricingDay[] = [];
    let needToRefetch = true;

    if (
      future_daily_pricing_records &&
      future_daily_pricing_records.length > 0
    ) {
      console.info(
        `[RENTAL_AMOUNTS] Found ${future_daily_pricing_records.length} existing pricing records`
      );

      future_daily_pricing_ids = future_daily_pricing_records.map(
        (record) => record.id
      );

      const { data: existing_pricing_data } = await supabase
        .from("future_daily_pricing_days")
        .select("*")
        .in("future_daily_pricing_id", future_daily_pricing_ids)
        .gte("date", year_start)
        .lt("date", year_end)
        .order("date", { ascending: true });

      future_daily_pricing_data = existing_pricing_data || [];

      // Check if latest date is at least 2 months ahead
      const now = new Date();
      const twoMonthsLater = new Date(now);
      twoMonthsLater.setMonth(now.getMonth() + 2);

      const latestDate = future_daily_pricing_data?.length
        ? new Date(
            future_daily_pricing_data[future_daily_pricing_data.length - 1].date
          )
        : null;

      if (latestDate && latestDate >= twoMonthsLater) {
        needToRefetch = false;
        console.info(
          `[RENTAL_AMOUNTS] Existing data is fresh - latest date: ${latestDate.toISOString()}, threshold: ${twoMonthsLater.toISOString()}`
        );
      } else {
        console.info(
          `[RENTAL_AMOUNTS] Existing data is stale - latest date: ${latestDate?.toISOString()}, threshold: ${twoMonthsLater.toISOString()}`
        );
      }
    } else {
      console.warn(
        `[RENTAL_AMOUNTS] No existing pricing records found for market ${market_code_data.id}, bedrooms ${future_daily_pricing_params.bedrooms}, year ${selected_year}`
      );
    }

    if (needToRefetch) {
      console.info(`[RENTAL_AMOUNTS] Fetching fresh data from AirDNA`);

      // Fetch from Airdna
      console.info(
        `[RENTAL_AMOUNTS] Fetching fresh data from AirDNA for city_id: ${market_code_data.city_id}, bedrooms: ${future_daily_pricing_params.bedrooms}`
      );
      const { futureDailyPricingData } = await airdnaUtils.fetchFuturePriceNew({
        bedrooms: future_daily_pricing_params.bedrooms,
        months: 12,
        cityId: market_code_data.city_id,
      });

      console.info(
        `[RENTAL_AMOUNTS] Received ${
          futureDailyPricingData?.data?.length || 0
        } months of data from AirDNA`
      );

      if (!futureDailyPricingData || !futureDailyPricingData.data.length) {
        console.error(
          `[RENTAL_AMOUNTS] No data received from AirDNA for city_id: ${market_code_data.city_id}`
        );
        return NextResponse.json({ data: [] });
      }

      // Delete old records first if they exist
      if (future_daily_pricing_ids.length > 0) {
        console.info(
          `[RENTAL_AMOUNTS] Deleting ${future_daily_pricing_ids.length} old pricing records`
        );
        const { error: deleteError } = await supabase
          .from("future_daily_pricing")
          .delete()
          .in("id", future_daily_pricing_ids);

        if (deleteError) {
          console.error(
            `[RENTAL_AMOUNTS] Error deleting old records:`,
            deleteError.message
          );
        } else {
          console.info(
            `[RENTAL_AMOUNTS] Successfully deleted old pricing records`
          );
        }
      }

      const format_daily_pricing_data = futureDailyPricingData.data.flatMap(
        (each) => {
          if (!each?.days?.length) return [];
          const newData = {
            _marketCode: market_code_data.id,
            _rentalAddress: rental_address?.id,
            days: [] as {
              date: string;
              pricePercentile90: number;
              medianPriceBooked: number;
            }[],
            year: each.year,
            month: each.month,
            bedrooms: future_daily_pricing_params.bedrooms,
            date: new Date(
              `${each.year}-${String(each.month).padStart(2, "0")}-01`
            ).toISOString(),
          };
          each.days.forEach((subEach) => {
            const bedroomData =
              subEach.room_type.entire_place.bedrooms?.[
                future_daily_pricing_params.bedrooms
              ];
            const pricePercentile90 =
              bedroomData?.price_percentile_available?.["90"];
            const medianPriceBooked = bedroomData?.median_price_booked?.[0];
            if (pricePercentile90) {
              newData.days.push({
                date: new Date(subEach.date).toISOString(),
                pricePercentile90,
                medianPriceBooked: medianPriceBooked ?? 0,
              });
            }
          });
          return newData.days.length > 1 ? [newData] : [];
        }
      );

      // Insert new data
      console.info(
        `[RENTAL_AMOUNTS] Inserting ${format_daily_pricing_data.length} new pricing records`
      );
      let insertedCount = 0;
      let errorCount = 0;

      for (const dailyPricing of format_daily_pricing_data) {
        try {
          const { data: pricingData, error: pricingError } = await supabase
            .from("future_daily_pricing")
            .upsert(
              {
                market_code_id: dailyPricing._marketCode,
                rental_address_id: dailyPricing._rentalAddress,
                date: dailyPricing.date,
                bedrooms: dailyPricing.bedrooms,
                year: dailyPricing.year,
                month: dailyPricing.month,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                ignoreDuplicates: false,
              }
            )
            .select("id")
            .single();

          if (pricingError) {
            console.error(
              `[RENTAL_AMOUNTS] Error inserting pricing data for ${dailyPricing.year}-${dailyPricing.month}:`,
              pricingError.message
            );
            errorCount++;
            continue;
          }

          if (pricingData?.id) {
            const daysData = dailyPricing.days.map((day) => ({
              future_daily_pricing_id: pricingData.id,
              date: day.date,
              price_percentile_90: day.pricePercentile90,
              median_price_booked: day.medianPriceBooked,
              created_at: new Date().toISOString(),
            }));

            const { error: daysError } = await supabase
              .from("future_daily_pricing_days")
              .upsert(daysData, {
                ignoreDuplicates: false,
              });

            if (daysError) {
              console.error(
                `[RENTAL_AMOUNTS] Error inserting ${daysData.length} days data for pricing ID ${pricingData.id}:`,
                daysError.message
              );
              errorCount++;
            } else {
              console.info(
                `[RENTAL_AMOUNTS] Successfully inserted ${daysData.length} days data for ${dailyPricing.year}-${dailyPricing.month}`
              );
              insertedCount++;
            }
          }
        } catch (err) {
          console.error(
            `[RENTAL_AMOUNTS] Unexpected error inserting pricing data for ${dailyPricing.year}-${dailyPricing.month}:`,
            err
          );
          errorCount++;
        }
      }

      console.info(
        `[RENTAL_AMOUNTS] Data insertion completed - Success: ${insertedCount}, Errors: ${errorCount}`
      );

      // Fetch the newly inserted data
      const { data: new_pricing_records } = await supabase
        .from("future_daily_pricing")
        .select("id")
        .eq("market_code_id", market_code_data.id)
        .eq("bedrooms", future_daily_pricing_params.bedrooms)
        .gte("date", year_start)
        .lt("date", year_end);

      if (new_pricing_records) {
        future_daily_pricing_ids = new_pricing_records.map(
          (record) => record.id
        );
      }
    }

    // Fetch final cleaned dataset
    let final_pricing_data: FutureDailyPricingDay[] = [];

    if (needToRefetch || future_daily_pricing_ids.length > 0) {
      const { data: fetched_pricing_data } = await supabase
        .from("future_daily_pricing_days")
        .select("*")
        .in("future_daily_pricing_id", future_daily_pricing_ids)
        .gte("date", year_start)
        .lt("date", year_end)
        .order("date", { ascending: true });

      final_pricing_data = fetched_pricing_data || [];
    } else {
      final_pricing_data = future_daily_pricing_data;
    }

    const unique_pricing_data = final_pricing_data
      ? Array.from(
          final_pricing_data
            .reduce((map, item) => {
              if (!map.has(item.date)) {
                map.set(item.date, item);
              }
              return map;
            }, new Map())
            .values()
        )
      : [];

    const processingTime = Date.now() - startTime;
    console.info(
      `[RENTAL_AMOUNTS] Request completed successfully - ${unique_pricing_data.length} unique pricing records returned in ${processingTime}ms`
    );

    return NextResponse.json({ data: unique_pricing_data });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `[RENTAL_AMOUNTS] Unexpected error after ${processingTime}ms:`,
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
