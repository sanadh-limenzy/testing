import { getMonth, getYear } from "date-fns";
import { env } from "@/env";

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

interface AirdnaResponse {
  payload: {
    metrics: AirdnaMetric[];
  };
  status: {
    type: string;
    response_id: string;
    message: string;
  };
}

const fetchFuturePriceNew = (
  cityId: string,
  bedrooms: number,
  month: number
): Promise<{
  error: boolean;
  futureDailyPricingData: {
    data: {
      month: number;
      year: number;
      days: {
        room_type: {
          entire_place: {
            bedrooms: {
              [x: number]: {
                price_percentile_available: {
                  "90": number;
                };
                median_price_booked: number[];
              };
            };
          };
        };
        date: string;
      }[];
    }[];
  };
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      const futureDailyPricingParams = {
        num_months: month,
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

      const response = await fetch(
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AirdnaResponse = await response.json();
      const newVal = data.payload.metrics;

      const formatedData = newVal.reduce(
        (
          acc: {
            month: number;
            year: number;
            days: {
              room_type: {
                entire_place: {
                  bedrooms: {
                    [x: number]: {
                      price_percentile_available: { "90": number };
                      median_price_booked: number[];
                    };
                  };
                };
              };
              date: string;
            }[];
          }[],
          cur: AirdnaMetric
        ) => {
          const curDate = new Date(cur.date);
          const curMonth = getMonth(curDate) + 1;
          const curmnthData = acc.find((el) => el.month === curMonth);

          if (curmnthData === undefined) {
            const obj: {
              month: number;
              year: number;
              days: {
                room_type: {
                  entire_place: {
                    bedrooms: {
                      [x: number]: {
                        price_percentile_available: {
                          "90": number;
                        };
                        median_price_booked: number[];
                      };
                    };
                  };
                };
                date: string;
              }[];
            } = {
              month: curMonth,
              year: getYear(curDate),
              days: [],
            };
            const daysObj = {
              room_type: {
                entire_place: {
                  bedrooms: {
                    [bedrooms]: {
                      price_percentile_available: {
                        "90": cur.median_available_rate, // Using median_available_rate as the 90th percentile equivalent
                      },
                      median_price_booked: [cur.median_booked_rate],
                    },
                  },
                },
              },
              date: cur.date,
            };
            obj.days.push(daysObj);
            acc.push(obj);
          } else {
            const daysObj1 = {
              room_type: {
                entire_place: {
                  bedrooms: {
                    [bedrooms]: {
                      price_percentile_available: {
                        "90": cur.median_available_rate, // Using median_available_rate as the 90th percentile equivalent
                      },
                      median_price_booked: [cur.median_booked_rate],
                    },
                  },
                },
              },
              date: cur.date,
            };
            curmnthData.days.push(daysObj1);
          }
          return acc;
        },
        []
      );

      const oldFormat = {
        data: formatedData,
      };
      return resolve({ error: false, futureDailyPricingData: oldFormat });
    } catch (err) {
      return reject({ isError: true, error: err });
    }
  });
};

const airdnaUtils = {
  fetchFuturePriceNew,
};

export default airdnaUtils;
