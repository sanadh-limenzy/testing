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
