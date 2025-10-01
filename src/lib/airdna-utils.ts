import { getMonth, getYear } from "date-fns";
import { env } from "@/env";

// ========== CORE TYPES ==========

interface AirdnaBaseResponse {
  status: {
    type: string;
    response_id: string;
    message: string;
  };
}

interface AirdnaMetric {
  date: string;
  available_count: number;
  booked_count: number;
  mean_available_rate: number;
  mean_booked_rate: number;
  median_available_rate: number;
  median_booked_rate: number;
  occupancy: number;
}

interface AirdnaMetricsResponse extends AirdnaBaseResponse {
  payload: {
    metrics: AirdnaMetric[];
  };
}

interface Location {
  lat: number;
  lng: number;
}

interface Amenities {
  has_aircon: boolean;
  has_breakfast: boolean;
  has_cable_tv: boolean;
  has_doorman: boolean;
  has_dryer: boolean;
  has_elevator: boolean;
  has_family_friendly: boolean;
  has_guidebook: boolean;
  has_gym: boolean;
  has_handicap_access: boolean;
  has_heating: boolean;
  has_hottub: boolean;
  has_indoor_fireplace: boolean;
  has_intercom: boolean;
  has_internet: boolean;
  has_kitchen: boolean;
  has_parking: boolean;
  has_pets_allowed: boolean;
  has_pool: boolean;
  has_smoking: boolean;
  has_suitable_for_events: boolean;
  has_tv: boolean;
  has_washer: boolean;
  has_wireless_internet: boolean;
}

interface Ratings {
  overall_rating: number;
  airbnb_accuracy_rating: number;
  airbnb_checkin_rating: number;
  airbnb_cleanliness_rating: number;
  airbnb_communication_rating: number;
  airbnb_location_rating: number;
  airbnb_value_rating?: number;
}

// ========== LISTING TYPES ==========

export interface AirDNAListing {
  property_id: string;
  airbnb_host_id?: string;
  airbnb_property_id?: string;
  airbnb_property_url?: string;
  vrbo_property_id: string;
  vrbo_property_url: string;
  market_id: string;
  market_name: string;
  country_name: string;
  city_name: string;
  state_name: string;
  zipcode: string;
  msa_name: string;
  location: Location;
  exact_location: unknown;
  title: string;
  bedrooms: number;
  bathrooms: number;
  accommodates: number;
  listing_type: string;
  property_type: string;
  instant_book: boolean;
  superhost: unknown;
  cancellation_policy?: string;
  host_size: string;
  amenities: Amenities;
  property_manager_name: string;
  professionally_managed: boolean;
  rating: number;
  ratings: Ratings;
  reviews: number;
  revenue_ltm: number;
  revenue_potential_ltm: number;
  occupancy_rate_ltm: number;
  average_daily_rate_ltm: number;
  days_available_ltm: number;
  days_blocked_ltm: number;
  days_reserved_ltm: number;
  num_reservations_ltm: number;
  currency: string;
  minimum_stay: number;
  response_rate?: number;
  response_time: unknown;
  created_date: string;
  last_calendar_update: string;
  last_scraped_date: string;
  license: string;
  cleaning_fee: number;
  images: string[];
}

interface ListingsResponse extends AirdnaBaseResponse {
  payload: {
    page_info: PageInfo;
    listings: AirDNAListing[];
    sort_order: string;
  };
}
export interface Comp {
  property_id: string;
  details: Details;
  location: Location;
  exact_location: boolean;
  location_area: LocationArea;
  metrics: Metrics;
  ratings: Ratings;
  platforms: Platforms;
  amenities: Amenities;
  country: Country;
  market: Market;
  professionally_managed: boolean;
  property_manager: PropertyManager;
  currency: string;
  comp_score: number;
}

export interface Details {
  title: string;
  market_name: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  reviews: number;
  rating: number;
  images: string[];
  price_tier: string;
  property_type: string;
  listing_type: string;
  real_estate_type: string;
  instant_book: boolean;
  superhost: boolean;
  cancellation_policy: string;
  host_size: string;
  minimum_stay: number;
  created_date: string;
  license: unknown;
  cleaning_fee: number;
}

export interface LocationArea {
  country_name: string;
  city_name: string;
  state_name: string;
  zipcode: number;
  msa_name: string;
}

export interface Metrics {
  occupancy: number;
  adr: number;
  revenue: number;
  revenue_potential: number;
  days_available: number;
  days_blocked: number;
  days_reserved: number;
  num_reservations: number;
  response_rate: number;
  response_time: unknown;
  last_calendar_update: string;
  last_scraped_date: string;
}

interface Platforms {
  airbnb_host_id: string;
  airbnb_property_id: string;
  airbnb_property_url: string;
  vrbo_property_id: unknown;
  vrbo_property_url: unknown;
}

export interface Country {
  country_id: number;
  country_name: string;
  code: string;
}

export interface Market {
  id: number;
  name: string;
  market_type: string;
  market_score: number;
  country_code: string;
}

export interface PropertyManager {
  property_manager_name: unknown;
  property_count: unknown;
  review_count: unknown;
}

interface CompsResponse extends AirdnaBaseResponse {
  payload: {
    page_info: PageInfo;
    currency: string;
    comps: Comp[];
  };
}

// ========== COMMON TYPES ==========

interface PageInfo {
  total_count: number;
  page_size: number;
  offset: number;
}

interface PaginationParams {
  page_size: number;
  offset: number;
}

interface Filter {
  field: string;
  type: "select";
  value: string | number | boolean;
}

interface DateRange {
  start_date: string;
  end_date: string;
}

interface Sort {
  field: string;
  direction: "asc" | "desc";
}

// ========== RESULT TYPES ==========

interface SuccessResult<T> {
  isError: false;
  data: T;
}

interface ErrorResult {
  isError: true;
  error: unknown;
  message?: string;
}

type ApiResult<T> = SuccessResult<T> | ErrorResult;

// ========== UTILITY FUNCTIONS ==========

class AirdnaApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public responseId?: string
  ) {
    super(message);
    this.name = "AirdnaApiError";
  }
}

const makeApiRequest = async <T>(
  endpoint: string,
  options: RequestInit
): Promise<T> => {
  const response = await fetch(endpoint, options);

  if (!response.ok) {
    console.log("Error fetching listings:", await response.json());
    throw new AirdnaApiError(
      `HTTP error! status: ${response.status}`,
      response.status
    );
  }

  return response.json();
};

// ========== API FUNCTIONS ==========

interface FuturePricingParams {
  cityId: string;
  bedrooms: number;
  months: number;
}

interface FuturePricingDay {
  room_type: {
    entire_place: {
      bedrooms: {
        [bedrooms: number]: {
          price_percentile_available: { "90": number };
          median_price_booked: number[];
        };
      };
    };
  };
  date: string;
}

interface FuturePricingMonth {
  month: number;
  year: number;
  days: FuturePricingDay[];
}

interface FuturePricingResponse {
  error: boolean;
  futureDailyPricingData: {
    data: FuturePricingMonth[];
  };
}

/**
 * Fetches future pricing data for a specific city and bedroom configuration
 */
const fetchFuturePriceNew = async ({
  cityId,
  bedrooms,
  months,
}: FuturePricingParams): Promise<FuturePricingResponse> => {
  const futureDailyPricingParams = {
    num_months: months,
    filters: [
      {
        field: "listing_type",
        type: "select",
        value: "entire_place",
      },
      {
        field: "bedrooms",
        type: "select",
        value: bedrooms,
      },
    ],
    currency: "usd",
    percentiles: [0.9],
  };

  const data: AirdnaMetricsResponse = await makeApiRequest(
    `${env.AIRDNA_BASE_URL_NEW}/market/${cityId}/future_pricing`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AIRDNA_CLIENT_TOKEN}`,
      },
      body: JSON.stringify(futureDailyPricingParams),
    }
  );

  const metrics = data.payload.metrics;

  const formattedData = metrics.reduce<FuturePricingMonth[]>(
    (acc, currentMetric) => {
      const currentDate = new Date(currentMetric.date);
      const currentMonth = getMonth(currentDate) + 1;
      const currentYear = getYear(currentDate);

      const monthData = acc.find(
        (item) => item.month === currentMonth && item.year === currentYear
      );

      const dayObject: FuturePricingDay = {
        room_type: {
          entire_place: {
            bedrooms: {
              [bedrooms]: {
                price_percentile_available: {
                  "90": currentMetric.median_available_rate,
                },
                median_price_booked: [currentMetric.median_booked_rate],
              },
            },
          },
        },
        date: currentMetric.date,
      };

      if (monthData) {
        monthData.days.push(dayObject);
      } else {
        acc.push({
          month: currentMonth,
          year: currentYear,
          days: [dayObject],
        });
      }

      return acc;
    },
    []
  );

  return {
    error: false,
    futureDailyPricingData: {
      data: formattedData,
    },
  };
};

interface ListingsParams {
  marketId: string;
  pageSize?: number;
  offset?: number;
}

/**
 * Fetches listings with high availability and superhost status
 */
const fetchListingsWithHighAvailabilityAndSuperhost = async ({
  marketId,
  pageSize = 10,
  offset = 0,
}: ListingsParams): Promise<ApiResult<AirDNAListing[]>> => {
  try {
    const listingsParams = {
      pagination: {
        page_size: pageSize,
        offset: offset,
      },
      filters: [
        {
          field: "days_available_ltm",
          type: "select",
          value: 365,
        },
        {
          field: "superhost",
          type: "select",
          value: true,
        },
      ],
      sort_order: "occupancy",
    };

    const data: ListingsResponse = await makeApiRequest(
      `${env.AIRDNA_BASE_URL_NEW}/market/${marketId}/listings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.AIRDNA_CLIENT_TOKEN}`,
        },
        body: JSON.stringify(listingsParams),
      }
    );

    return {
      isError: false,
      data: data.payload?.listings || [],
    };
  } catch (error) {
    console.log("Error fetching listings:", error);
    return {
      isError: true,
      error,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

interface FetchCompsOptions {
  listingId: string;
  bedrooms?: number;
  startDate?: string;
  endDate?: string;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

interface CompsRequestBody {
  filters: Filter[];
  pagination: PaginationParams;
  currency: string;
  date_range?: DateRange;
  sort?: Sort;
}

/**
 * Fetch comparable property listings based on location and dates
 */
const fetchCompsListNew = async (
  options: FetchCompsOptions
): Promise<ApiResult<Comp[]>> => {
  try {
    const requestBody: CompsRequestBody = {
      filters: [
        {
          field: "listing_type",
          type: "select",
          value: "entire_place",
        },
        {
          field: "bedrooms",
          type: "select",
          value: options.bedrooms ?? 2,
        },
      ],
      pagination: {
        page_size: options.pageSize ?? 10,
        offset: 0,
      },
      currency: "usd",
    };

    if (options.startDate && options.endDate) {
      requestBody.date_range = {
        start_date: options.startDate,
        end_date: options.endDate,
      };
    }

    if (options.orderBy) {
      requestBody.sort = {
        field: options.orderBy,
        direction: options.orderDirection ?? "desc",
      };
    }

    const data: CompsResponse = await makeApiRequest(
      `${env.AIRDNA_BASE_URL_NEW}/listing/${options.listingId}/comps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.AIRDNA_CLIENT_TOKEN}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    return {
      isError: false,
      data: data.payload?.comps ?? [],
    };
  } catch (error) {
    console.error("Error fetching comps:", error);

    return {
      isError: true,
      error,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// ========== EXPORTS ==========

const airdnaUtils = {
  fetchFuturePriceNew,
  fetchListingsWithHighAvailabilityAndSuperhost,
  fetchCompsListNew,
};

export {
  type FuturePricingParams,
  type ListingsParams,
  type FetchCompsOptions,
  type ApiResult,
  type SuccessResult,
  type ErrorResult,
  AirdnaApiError,
};

export default airdnaUtils;