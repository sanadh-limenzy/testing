import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserAddress, UserNotificationSettings } from "@/@types";
import { SubscriberProfile } from "@/@types/user";

export const dynamic = "force-dynamic";

interface UpdateSubscriberData {
  // Subscriber Profile fields
  business_name?: string;
  legal_business_name?: string;
  business_website?: string;
  business_phone_code?: string;
  business_phone?: string;
  business_email?: string;
  business_entity_type?: string;
  business_nature?: string;
  years_in_business?: number;
  ssn?: number;
  tax_ein?: number;
  rental_amount?: number;
  is_auto_renew_subscription?: boolean;
  is_already_have_reimbursement_plan?: boolean;
  is_manual_valuation?: boolean;
  is_trial_allowed?: boolean;
  event_tax_percentage?: number;

  // Address fields
  addresses?: {
    id?: string;
    address_type?: string;
    business_name?: string;
    business_phone_code?: string;
    business_phone?: string;
    business_email?: string;
    business_entity_type?: string;
    business_nature?: string;
    is_home_office_deduction?: boolean;
    tax_filing_status?: string;
    estimated_income?: number;
    nickname?: string;
    street?: string;
    description?: string;
    apartment?: string;
    county?: string;
    city?: string;
    state?: string;
    zip?: string;
    bedrooms?: number;
    country?: string;
    lat?: number;
    lng?: number;
    time_zone?: string;
    year?: number;
    is_default?: boolean;
    is_active?: boolean;
    is_deleted?: boolean;
  }[];

  // Notification settings
  notification_settings?: {
    pre_event_email_notifications?: boolean;
    during_event_email_notifications?: boolean;
    post_event_email_notifications?: boolean;
    high_upcoming_rental_event_price?: boolean;
    using_the_app_tax_pro?: boolean;
    tax_code_questions?: boolean;
    annual_filing?: boolean;
    best_practices_posts?: boolean;
    money_savings_posts?: boolean;
    tax_law_posts?: boolean;
    time_savings_posts?: boolean;
  };
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "[PUT /api/subscriber/update] Authentication error:",
        authError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body: UpdateSubscriberData = await request.json();

    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No data provided for update" },
        { status: 400 }
      );
    }

    let updateResults: UpdateSubscriberData = {};

    const subscriberProfileUpdates: Partial<SubscriberProfile> = {};

    if (body.business_name !== undefined) {
      subscriberProfileUpdates.business_name = body.business_name;
    }
    if (body.legal_business_name !== undefined) {
      subscriberProfileUpdates.legal_business_name = body.legal_business_name;
    }
    if (body.business_website !== undefined) {
      subscriberProfileUpdates.business_website = body.business_website;
    }
    if (body.business_phone_code !== undefined) {
      subscriberProfileUpdates.business_phone_code = body.business_phone_code;
    }
    if (body.business_phone !== undefined) {
      subscriberProfileUpdates.business_phone = body.business_phone;
    }
    if (body.business_email !== undefined) {
      subscriberProfileUpdates.business_email = body.business_email;
    }
    if (body.business_entity_type !== undefined) {
      subscriberProfileUpdates.business_entity_type = body.business_entity_type;
    }
    if (body.business_nature !== undefined) {
      subscriberProfileUpdates.business_nature = body.business_nature;
    }
    if (body.years_in_business !== undefined) {
      subscriberProfileUpdates.years_in_business = body.years_in_business;
    }
    if (body.ssn !== undefined) {
      subscriberProfileUpdates.ssn = body.ssn;
    }
    if (body.tax_ein !== undefined) {
      subscriberProfileUpdates.tax_ein = body.tax_ein;
    }
    if (body.rental_amount !== undefined) {
      subscriberProfileUpdates.rental_amount = body.rental_amount;
    }
    if (body.is_auto_renew_subscription !== undefined) {
      subscriberProfileUpdates.is_auto_renew_subscription =
        body.is_auto_renew_subscription;
    }
    if (body.is_already_have_reimbursement_plan !== undefined) {
      subscriberProfileUpdates.is_already_have_reimbursement_plan =
        body.is_already_have_reimbursement_plan;
    }
    if (body.is_manual_valuation !== undefined) {
      subscriberProfileUpdates.is_manual_valuation = body.is_manual_valuation;
    }
    if (body.is_trial_allowed !== undefined) {
      subscriberProfileUpdates.is_trial_allowed = body.is_trial_allowed;
    }
    if (body.event_tax_percentage !== undefined) {
      subscriberProfileUpdates.event_tax_percentage = body.event_tax_percentage;
    }

    if (Object.keys(subscriberProfileUpdates).length > 0) {
      const { data: subscriberProfileData, error: subscriberProfileError } =
        await supabase
          .from("subscriber_profile")
          .update(subscriberProfileUpdates)
          .eq("user_id", user.id)
          .select()
          .single();

      if (subscriberProfileError) {
        console.error(
          "[PUT /api/subscriber/update] Error updating subscriber profile:",
          subscriberProfileError
        );
        return NextResponse.json(
          { error: "Failed to update subscriber profile" },
          { status: 500 }
        );
      }

      updateResults = subscriberProfileData;
    }

    // Update addresses if provided
    if (body.addresses && Array.isArray(body.addresses)) {
      const addressUpdates = [];

      for (const address of body.addresses) {
        if (address.id) {
          // Update existing address - check each field individually
          const addressUpdateData: Partial<UserAddress> = {};

          if (address.address_type !== undefined) {
            addressUpdateData.address_type = address.address_type;
          }
          if (address.business_name !== undefined) {
            addressUpdateData.business_name = address.business_name;
          }
          if (address.business_phone_code !== undefined) {
            addressUpdateData.business_phone_code = address.business_phone_code;
          }
          if (address.business_phone !== undefined) {
            addressUpdateData.business_phone = address.business_phone;
          }
          if (address.business_email !== undefined) {
            addressUpdateData.business_email = address.business_email;
          }
          if (address.business_entity_type !== undefined) {
            addressUpdateData.business_entity_type =
              address.business_entity_type;
          }
          if (address.business_nature !== undefined) {
            addressUpdateData.business_nature = address.business_nature;
          }
          if (address.is_home_office_deduction !== undefined) {
            addressUpdateData.is_home_office_deduction =
              address.is_home_office_deduction;
          }
          if (address.tax_filing_status !== undefined) {
            addressUpdateData.tax_filing_status = address.tax_filing_status;
          }
          if (address.estimated_income !== undefined) {
            addressUpdateData.estimated_income = address.estimated_income;
          }
          if (address.nickname !== undefined) {
            addressUpdateData.nickname = address.nickname;
          }
          if (address.street !== undefined) {
            addressUpdateData.street = address.street;
          }
          if (address.description !== undefined) {
            addressUpdateData.description = address.description;
          }
          if (address.apartment !== undefined) {
            addressUpdateData.apartment = address.apartment;
          }
          if (address.county !== undefined) {
            addressUpdateData.county = address.county;
          }
          if (address.city !== undefined) {
            addressUpdateData.city = address.city;
          }
          if (address.state !== undefined) {
            addressUpdateData.state = address.state;
          }
          if (address.zip !== undefined) {
            addressUpdateData.zip = address.zip;
          }
          if (address.bedrooms !== undefined) {
            addressUpdateData.bedrooms = address.bedrooms;
          }
          if (address.country !== undefined) {
            addressUpdateData.country = address.country;
          }
          if (address.lat !== undefined) {
            addressUpdateData.lat = address.lat;
          }
          if (address.lng !== undefined) {
            addressUpdateData.lng = address.lng;
          }
          if (address.time_zone !== undefined) {
            addressUpdateData.time_zone = address.time_zone;
          }
          if (address.year !== undefined) {
            addressUpdateData.year = address.year;
          }
          if (address.is_default !== undefined) {
            addressUpdateData.is_default = address.is_default;
          }
          if (address.is_active !== undefined) {
            addressUpdateData.is_active = address.is_active;
          }
          if (address.is_deleted !== undefined) {
            addressUpdateData.is_deleted = address.is_deleted;
          }

          if (Object.keys(addressUpdateData).length > 0) {
            addressUpdateData.updated_at = new Date().toISOString();

            const { data: addressData, error: addressError } = await supabase
              .from("user_addresses")
              .update(addressUpdateData)
              .eq("id", address.id)
              .eq("created_by", user.id)
              .select()
              .single();

            if (addressError) {
              console.error(
                "[PUT /api/subscriber/update] Error updating address:",
                addressError
              );
              return NextResponse.json(
                { error: `Failed to update address ${address.id}` },
                { status: 500 }
              );
            }

            addressUpdates.push(addressData);
          }
        } else {
          // Create new address - only include defined fields
          const newAddressData: Partial<UserAddress> = {
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (address.address_type !== undefined) {
            newAddressData.address_type = address.address_type;
          }
          if (address.business_name !== undefined) {
            newAddressData.business_name = address.business_name;
          }
          if (address.business_phone_code !== undefined) {
            newAddressData.business_phone_code = address.business_phone_code;
          }
          if (address.business_phone !== undefined) {
            newAddressData.business_phone = address.business_phone;
          }
          if (address.business_email !== undefined) {
            newAddressData.business_email = address.business_email;
          }
          if (address.business_entity_type !== undefined) {
            newAddressData.business_entity_type = address.business_entity_type;
          }
          if (address.business_nature !== undefined) {
            newAddressData.business_nature = address.business_nature;
          }
          if (address.is_home_office_deduction !== undefined) {
            newAddressData.is_home_office_deduction =
              address.is_home_office_deduction;
          }
          if (address.tax_filing_status !== undefined) {
            newAddressData.tax_filing_status = address.tax_filing_status;
          }
          if (address.estimated_income !== undefined) {
            newAddressData.estimated_income = address.estimated_income;
          }
          if (address.nickname !== undefined) {
            newAddressData.nickname = address.nickname;
          }
          if (address.street !== undefined) {
            newAddressData.street = address.street;
          }
          if (address.description !== undefined) {
            newAddressData.description = address.description;
          }
          if (address.apartment !== undefined) {
            newAddressData.apartment = address.apartment;
          }
          if (address.county !== undefined) {
            newAddressData.county = address.county;
          }
          if (address.city !== undefined) {
            newAddressData.city = address.city;
          }
          if (address.state !== undefined) {
            newAddressData.state = address.state;
          }
          if (address.zip !== undefined) {
            newAddressData.zip = address.zip;
          }
          if (address.bedrooms !== undefined) {
            newAddressData.bedrooms = address.bedrooms;
          }
          if (address.country !== undefined) {
            newAddressData.country = address.country;
          }
          if (address.lat !== undefined) {
            newAddressData.lat = address.lat;
          }
          if (address.lng !== undefined) {
            newAddressData.lng = address.lng;
          }
          if (address.time_zone !== undefined) {
            newAddressData.time_zone = address.time_zone;
          }
          if (address.year !== undefined) {
            newAddressData.year = address.year;
          }
          if (address.is_default !== undefined) {
            newAddressData.is_default = address.is_default;
          }
          if (address.is_active !== undefined) {
            newAddressData.is_active = address.is_active;
          }
          if (address.is_deleted !== undefined) {
            newAddressData.is_deleted = address.is_deleted;
          }

          const { data: addressData, error: addressError } = await supabase
            .from("user_addresses")
            .insert(newAddressData)
            .select()
            .single();

          if (addressError) {
            console.error(
              "[PUT /api/subscriber/update] Error creating address:",
              addressError
            );
            return NextResponse.json(
              { error: "Failed to create address" },
              { status: 500 }
            );
          }

          addressUpdates.push(addressData);
        }
      }

      updateResults.addresses = addressUpdates;
    }

    // Update notification settings if provided
    if (body.notification_settings) {
      const { data: existingSettings, error: fetchError } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(
          "[PUT /api/subscriber/update] Error fetching notification settings:",
          fetchError
        );
        return NextResponse.json(
          { error: "Failed to fetch notification settings" },
          { status: 500 }
        );
      }

      // Check each notification setting field individually
      const notificationUpdateData: Partial<UserNotificationSettings> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (
        body.notification_settings.pre_event_email_notifications !== undefined
      ) {
        notificationUpdateData.pre_event_email_notifications =
          body.notification_settings.pre_event_email_notifications;
      }
      if (
        body.notification_settings.during_event_email_notifications !==
        undefined
      ) {
        notificationUpdateData.during_event_email_notifications =
          body.notification_settings.during_event_email_notifications;
      }
      if (
        body.notification_settings.post_event_email_notifications !== undefined
      ) {
        notificationUpdateData.post_event_email_notifications =
          body.notification_settings.post_event_email_notifications;
      }
      if (
        body.notification_settings.high_upcoming_rental_event_price !==
        undefined
      ) {
        notificationUpdateData.high_upcoming_rental_event_price =
          body.notification_settings.high_upcoming_rental_event_price;
      }
      if (body.notification_settings.using_the_app_tax_pro !== undefined) {
        notificationUpdateData.using_the_app_tax_pro =
          body.notification_settings.using_the_app_tax_pro;
      }
      if (body.notification_settings.tax_code_questions !== undefined) {
        notificationUpdateData.tax_code_questions =
          body.notification_settings.tax_code_questions;
      }
      if (body.notification_settings.annual_filing !== undefined) {
        notificationUpdateData.annual_filing =
          body.notification_settings.annual_filing;
      }
      if (body.notification_settings.best_practices_posts !== undefined) {
        notificationUpdateData.best_practices_posts =
          body.notification_settings.best_practices_posts;
      }
      if (body.notification_settings.money_savings_posts !== undefined) {
        notificationUpdateData.money_savings_posts =
          body.notification_settings.money_savings_posts;
      }
      if (body.notification_settings.tax_law_posts !== undefined) {
        notificationUpdateData.tax_law_posts =
          body.notification_settings.tax_law_posts;
      }
      if (body.notification_settings.time_savings_posts !== undefined) {
        notificationUpdateData.time_savings_posts =
          body.notification_settings.time_savings_posts;
      }

      let notificationResult;
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from("user_notification_settings")
          .update(notificationUpdateData)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error(
            "[PUT /api/subscriber/update] Error updating notification settings:",
            error
          );
          return NextResponse.json(
            { error: "Failed to update notification settings" },
            { status: 500 }
          );
        }

        notificationResult = data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("user_notification_settings")
          .insert({
            ...notificationUpdateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error(
            "[PUT /api/subscriber/update] Error creating notification settings:",
            error
          );
          return NextResponse.json(
            { error: "Failed to create notification settings" },
            { status: 500 }
          );
        }

        notificationResult = data;
      }

      updateResults.notification_settings = notificationResult;
    }

    return NextResponse.json({
      success: true,
      message: "Subscriber data updated successfully",
      data: updateResults,
    });
  } catch (error) {
    console.error("[PUT /api/subscriber/update] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
