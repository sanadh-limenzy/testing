import { z } from "zod";
import { meetsMinimumDuration } from "@/lib/time-utils";

export const eventFormSchema = z
  .object({
    residence: z.string(),
    business_address_id: z.string(),
    title: z
      .string("Event name is required")
      .min(5, "Event name must be at least 5 characters")
      .max(50, "Event name must be no more than 50 characters")
      .optional()
      .or(z.literal("")),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
      .optional()
      .or(z.literal("")),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
      .optional()
      .or(z.literal("")),
    people_count: z
      .string()
      .regex(/^\d+$/, "Must be a valid number")
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(3, "Minimum 3 attendees required")
          .max(99, "Maximum 99 attendees allowed")
      )
      .transform((val) => val.toString())
      .optional()
      .or(z.literal("")),
    people_names: z
      .array(
        z.object({
          name: z.string().optional(),
        })
      )
      .optional(),
    rental_amount: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => {
        if (!val) return true;
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      }, "Rental amount must be a valid number"),
    description: z
      .string()
      .max(1000, "Description must be no more than 1000 characters")
      .min(10, "Description must be at least 10 characters"),
    excluded_areas: z.string().optional(),
    manual_valuation: z.boolean().optional(),
    money_paid_to_personal: z.boolean().optional(),
    upload_documents: z.array(z.instanceof(File)).optional(),
    event_documents: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          url: z.string(),
          type: z.string(),
          size: z.number(),
          created_at: z.string(),
        })
      )
      .optional(),
    thumbnails: z.array(z.string()).optional(),
    upload_thumbnails: z.array(z.instanceof(File)).optional(),
    daily_amounts: z
      .array(
        z.object({
          date: z.string(),
          amount: z.number(),
        })
      )
      .optional(),
    currentAction: z.enum(["book", "update", "template", "draft"]).optional(),
    templateName: z.string().optional(),
    is_draft: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Custom validation: end date must not be before start date (only if both are provided)
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["end_date"],
    }
  )
  .refine(
    (data) => {
      // Custom validation: valuation documents are required when manual valuation is enabled
      if (data.manual_valuation) {
        return (
          (data.upload_documents && data.upload_documents.length > 0) ||
          (data.event_documents && data.event_documents.length > 0)
        );
      }
      return true;
    },
    {
      message: "event documents are required when manual valuation is enabled",
      path: ["upload_documents"],
    }
  )
  .refine(
    (data) => {
      // Custom validation: event duration must be at least 4.5 hours
      if (data.start_time && data.end_time) {
        return meetsMinimumDuration(data.start_time, data.end_time, 4.5);
      }
      return true;
    },
    {
      message: "Event must last 4.5 hours or more",
      path: ["end_time"],
    }
  );

// Strict validation schema for form submission
export const eventFormSubmitSchema = z
  .object({
    residence: z.string().min(1, "Residence is required"),
    title: z
      .string()
      .min(5, "Event name must be at least 5 characters")
      .max(50, "Event name must be no more than 50 characters"),
    start_date: z
      .string()
      .min(1, "Start date is required")
      .refine((date) => {
        return new Date(date);
      }, "Invalid start date"),
    end_date: z.string().min(1, "End date is required"),
    start_time: z
      .string()
      .min(1, "Start time is required")
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
    end_time: z
      .string()
      .min(1, "End time is required")
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
    people_count: z
      .string()
      .min(1, "Number of attendees is required")
      .regex(/^\d+$/, "Must be a valid number")
      .transform((val) => parseInt(val))
      .pipe(
        z
          .number()
          .min(1, "Minimum 1 attendee required")
          .max(9999999999, "Maximum attendees exceeded")
      )
      .transform((val) => val.toString()),
    people_names: z.array(
      z.object({
        name: z.string(),
      })
    ),
    rental_amount: z.string(),
    description: z
      .string()
      .max(1000, "Description must be no more than 1000 characters")
      .min(10, "Description must be at least 10 characters"),
    excluded_areas: z
      .string()
      .min(3, "Excluded areas must be at least 3 characters"),
    manual_valuation: z.boolean(),
    money_paid_to_personal: z.boolean(),
    upload_documents: z.array(z.instanceof(File)),
    event_documents: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number(),
        created_at: z.string(),
      })
    ),
    thumbnails: z.array(z.string()),
    upload_thumbnails: z.array(z.instanceof(File)),
    daily_amounts: z.array(
      z.object({
        date: z.string(),
        amount: z.number(),
      })
    ),
    currentAction: z.enum(["book", "update", "template", "draft"]).optional(),
    templateName: z.string().optional(),
    is_draft: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Custom validation: end date must not be before start date
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["end_date"],
    }
  )
  .refine(
    (data) => {
      // Custom validation: valuation documents are required when manual valuation is enabled
      if (data.manual_valuation) {
        return (
          (data.upload_documents && data.upload_documents.length > 0) ||
          (data.event_documents && data.event_documents.length > 0)
        );
      }
      return true;
    },
    {
      message: "event documents are required when manual valuation is enabled",
      path: ["upload_documents"],
    }
  )
  .refine(
    (data) => {
      // Custom validation: event duration must be at least 4.5 hours
      if (data.start_time && data.end_time) {
        return meetsMinimumDuration(data.start_time, data.end_time, 4.5);
      }
      return true;
    },
    {
      message: "Event must last 4.5 hours or more",
      path: ["end_time"],
    }
  );

// Infer the type from the schema
export type EventFormData = z.infer<typeof eventFormSchema>;

// Tax Packet Validation Schemas
export const taxPacketPreviewQuerySchema = z.object({
  selected_year: z.string().min(1, "Selected year is required"),
});

export const sendTaxPacketRequestSchema = z.object({
  email: z.email("Invalid email address"),
  selected_year: z.string().min(1, "Selected year is required"),
  is_send_to_self: z.boolean().default(false),
});

export const taxDeductionsSchema = z.object({
  totalDeduction: z.number().min(0, "Total deduction must be non-negative"),
  potentialSavings: z.number().min(0, "Potential savings must be non-negative"),
  totalTaxableAmount: z.number().min(0, "Total taxable amount must be non-negative").optional(),
  daysUsed: z.number().min(0, "Days used must be non-negative").optional(),
  daysRemaining: z.number().min(0, "Days remaining must be non-negative").optional(),
});

export const calculatedTaxDeductionsSchema = z.object({
  totalDeduction: z.number().min(0, "Total deduction must be non-negative").optional(),
  totalTaxableAmount: z.number().min(0, "Total taxable amount must be non-negative").optional(),
  potentialSavings: z.number().min(0, "Potential savings must be non-negative").optional(),
  daysUsed: z.number().min(0, "Days used must be non-negative").optional(),
  daysRemaining: z.number().min(0, "Days remaining must be non-negative").optional(),
});

export const compSchema = z.object({
  property_id: z.string().min(1, "Property ID is required"),
  details: z.object({
    title: z.string().min(1, "Title is required"),
    bedrooms: z.number().min(0, "Bedrooms must be non-negative"),
    bathrooms: z.number().min(0, "Bathrooms must be non-negative"),
  }),
  metrics: z.object({
    adr: z.number().min(0, "ADR must be non-negative"),
  }),
});

export const airDNAListingSchema = z.object({
  property_id: z.string().min(1, "Property ID is required"),
  country_name: z.string().min(1, "Country name is required"),
  state_name: z.string().min(1, "State name is required"),
  city_name: z.string().min(1, "City name is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
  bedrooms: z.number().min(0, "Bedrooms must be non-negative"),
  location: z.object({
    lat: z.number().min(-90).max(90, "Invalid latitude"),
    lng: z.number().min(-180).max(180, "Invalid longitude"),
  }),
});

export const marketCodeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  zip: z.string().min(1, "ZIP is required"),
  city_id: z.string().min(1, "City ID is required"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const subscriberProfileWithReimbursementPlanSchema = z.object({
  id: z.string().min(1, "ID is required"),
  user_id: z.string().min(1, "User ID is required"),
  is_free_subscription_active: z.boolean(),
  is_already_have_reimbursement_plan: z.boolean(),
  reimbursement_plan: z.object({
    id: z.string().min(1, "ID is required"),
    is_signature_done: z.boolean(),
    signature_doc_url: z.string().url("Invalid URL").nullable(),
  }).nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const taxPacketDataSchema = z.object({
  taxYear: z.number().min(2000).max(2100, "Invalid tax year"),
  userName: z.string().min(1, "User name is required"),
  totalEvents: z.number().min(0, "Total events must be non-negative"),
  taxDeductions: calculatedTaxDeductionsSchema,
  csvLink: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid CSV link URL"
  ),
  reimbursementPlan: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid reimbursement plan URL"
  ),
  eventsArray: z.array(z.any()), // Will be validated separately
  isAlreadyHaveReimbursementPlan: z.boolean(),
});

export const taxPacketSaveDataSchema = z.object({
  _events: z.array(z.string().min(1, "Event ID is required")),
  amount: z.number().min(0, "Amount must be non-negative"),
  packetId: z.string().min(1, "Packet ID is required"),
  eventsCsvLink: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid CSV link URL"
  ),
  pdfPath: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid PDF path URL"
  ),
  reimbursementPlan: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid reimbursement plan URL"
  ),
  _createdBy: z.string().min(1, "Created by is required").optional(),
  status: z.string().min(1, "Status is required").optional(),
  rentalAgreement: z.array(z.any()).optional(),
  events: z.array(z.any()).optional(),
  totalEvents: z.number().min(0, "Total events must be non-negative").optional(),
  year: z.union([z.string(), z.number()]).optional(),
});

export const taxPacketPDFResultSchema = z.object({
  success: z.boolean(),
  data: z.object({
    pdfPath: z.string().url("Invalid PDF path URL"),
    csvLink: z.string().url("Invalid CSV link URL"),
    eventsArray: z.array(z.object({
      "Event #": z.string(),
      Residence: z.string(),
      "Corporate Event": z.string(),
      Description: z.string(),
      "Start Time": z.string(),
      "End Time": z.string(),
      Duration: z.string(),
      Amount: z.string(),
      "Taxable Amount": z.string(),
      "Add To My Calendar": z.string(),
      Thumbnails: z.string(),
      "Number of people attending": z.string(),
      "Areas not included": z.string(),
      "Defendability Score": z.string(),
      Invoice: z.string(),
      Documents: z.string(),
    })),
  }).nullable(),
  error: z.string().nullable(),
});

// Type exports
export type TaxPacketPreviewQuery = z.infer<typeof taxPacketPreviewQuerySchema>;
export type SendTaxPacketRequest = z.infer<typeof sendTaxPacketRequestSchema>;
export type TaxDeductionsValidated = z.infer<typeof taxDeductionsSchema>;
export type CalculatedTaxDeductionsValidated = z.infer<typeof calculatedTaxDeductionsSchema>;
export type CompValidated = z.infer<typeof compSchema>;
export type AirDNAListingValidated = z.infer<typeof airDNAListingSchema>;
export type MarketCodeValidated = z.infer<typeof marketCodeSchema>;
export type SubscriberProfileWithReimbursementPlanValidated = z.infer<typeof subscriberProfileWithReimbursementPlanSchema>;
export type TaxPacketDataValidated = z.infer<typeof taxPacketDataSchema>;
export type TaxPacketSaveDataValidated = z.infer<typeof taxPacketSaveDataSchema>;
export type TaxPacketPDFResultValidated = z.infer<typeof taxPacketPDFResultSchema>;
