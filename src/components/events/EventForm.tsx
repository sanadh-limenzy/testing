"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  eventFormSchema,
  EventFormData,
  eventFormSubmitSchema,
} from "@/@types/validation";
import { EventFormProps } from "@/@types/event-form";
import {
  EventFormContextValue,
  EventFormProvider,
} from "@/contexts/EventFormContext";
import { meetsMinimumDuration } from "@/lib/time-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

// Import form sections
import { EventDetailsSection } from "./EventDetailsSection";
import { EventTimingSection } from "./EventTimingSection";
import { EventAttendeesSection } from "./EventAttendeesSection";
import { EventRentalSection } from "./EventRentalSection";
import { EventDescriptionSection } from "./EventDescriptionSection";
import { EventAreasSection } from "./EventAreasSection";
import { EventPhotosSection } from "./EventPhotosSection";
import { EventFormActions } from "./EventFormActions";

// Import sidebar components
import { TaxDeductionsCard } from "./TaxDeductionsCard";
import { DefensibilityScoreCard } from "./DefensibilityScoreCard";

// Import skeleton
import { EventFormSkeleton } from "@/components/ui/skeleton-loaders";
import { useUpdateEvent } from "@/hooks/useEvent";
import { useCreateEvent } from "@/hooks/useEvent";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useCreateEventTemplate } from "@/hooks/useEventTemplates";
import z from "zod";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import eventUtils from "@/lib/event-utils";
import { toast } from "sonner";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function EventForm({
  mode,
  property,
  initialData,
  showSidebar = true,
  isLoading = false,
  eventId,
  eventsFromRentalAddress,
  business_address_id,
  datePrices,
  is_custom_plan,
  rentalAddresses,
}: EventFormProps) {
  const { mutateAsync: updateEvent } = useUpdateEvent();
  const { mutateAsync: createEvent } = useCreateEvent();
  const { mutateAsync: uploadFiles } = useFileUpload();
  const { mutateAsync: createTemplate } = useCreateEventTemplate();
  const [clearTrigger, setClearTrigger] = useState(false);
  const isReadOnly = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";
  const router = useRouter();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      residence: property?.id || "",
      business_address_id,
      title: "",
      start_date: "",
      end_date: "",
      start_time: "08:00",
      end_time: "13:00",
      people_count: "",
      rental_amount: property?.avarage_value?.toString() || "",
      description: "",
      manual_valuation: false,
      money_paid_to_personal: false,
      event_documents: [],
      excluded_areas: property?.is_home_office_deduction ? "Home Office" : "",
      upload_documents: [],
      thumbnails: [],
      upload_thumbnails: [],
      people_names: [],
      daily_amounts: [],
      currentAction: "book",
      templateName: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        residence: property?.id || "",
        business_address_id,
        title: initialData.title || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        start_time: initialData.start_time || "08:00",
        end_time: initialData.end_time || "13:00",
        people_count: initialData.people_count || "",
        rental_amount:
          initialData.rental_amount ||
          property?.avarage_value?.toString() ||
          "",
        description: initialData.description || "",
        manual_valuation: initialData.manual_valuation || false,
        money_paid_to_personal: initialData.money_paid_to_personal || false,
        upload_documents: initialData.upload_documents || [],
        event_documents: initialData.event_documents || [],
        excluded_areas:
          initialData.excluded_areas ||
          (property?.is_home_office_deduction ? "Home Office" : ""),
        thumbnails: initialData.thumbnails || [],
        upload_thumbnails: [],
        people_names: initialData.people_names || [],
        daily_amounts: initialData.daily_amounts || [],
      });
    }
  }, [
    initialData,
    property?.id,
    property?.avarage_value,
    form,
    business_address_id,
    property?.is_home_office_deduction,
  ]);

  // Watch specific fields instead of all form values
  const title = form.watch("title");
  const description = form.watch("description");
  const peopleCount = form.watch("people_count");
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const rentalAmount = form.watch("rental_amount");
  const startTime = form.watch("start_time");
  const endTime = form.watch("end_time");
  const manualValuation = form.watch("manual_valuation");
  const moneyPaidToPersonal = form.watch("money_paid_to_personal");
  const eventDocuments = form.watch("event_documents");
  const uploadDocuments = form.watch("upload_documents");

  // Debounce expensive text validations
  const debouncedTitle = useDebounce(title, 300);
  const debouncedDescription = useDebounce(description, 300);
  const debouncedRentalAmount = useDebounce(rentalAmount, 300);

  const validationStates = React.useMemo(() => {
    return {
      eventNameValid: !!(debouncedTitle && debouncedTitle.trim().length >= 3),
      descriptionValid: !!(
        debouncedDescription && debouncedDescription.trim().length >= 2
      ),
      peopleCountValid: parseInt(peopleCount || "0") >= 3,
      hasValidDates: !!(startDate && endDate),
      hasValidAmount: !!(
        debouncedRentalAmount && debouncedRentalAmount.trim().length >= 10
      ),
      durationValid: meetsMinimumDuration(startTime, endTime, 4.5),
    };
  }, [
    debouncedTitle,
    debouncedDescription,
    peopleCount,
    startDate,
    endDate,
    debouncedRentalAmount,
    startTime,
    endTime,
  ]);

  const defendabilityScore = React.useMemo(() => {
    return eventUtils.defendabilityScore({
      description: description || "",
      peopleCount: parseInt(peopleCount || "0"),
      duration: meetsMinimumDuration(startTime, endTime, 4.5),
      digitalValuation: !manualValuation || false,
      moneyPaidToPersonnel: moneyPaidToPersonal || false,
      evidenceSupporting:
        (eventDocuments && eventDocuments?.length > 0) ||
        (uploadDocuments && uploadDocuments?.length > 0) ||
        false,
    });
  }, [
    description,
    peopleCount,
    startTime,
    endTime,
    manualValuation,
    moneyPaidToPersonal,
    eventDocuments,
    uploadDocuments,
  ]);

  const eventsFromRentalAddressWithoutTheCurrentEvent = React.useMemo(() => {
    return eventsFromRentalAddress?.filter((event) => event.id !== eventId);
  }, [eventsFromRentalAddress, eventId]);

  // Memoize the expensive event days calculation
  const number_of_event_days_used = React.useMemo(() => {
    if (!eventsFromRentalAddressWithoutTheCurrentEvent) return 0;

    const pastEventDays = eventsFromRentalAddressWithoutTheCurrentEvent
      .map((event) => {
        return event.start_date && event.end_date
          ? differenceInDays(
              new Date(event.end_date),
              new Date(event.start_date)
            ) + 1
          : 0;
      })
      .reduce((acc, curr) => acc + curr, 0);

    if (isCreateMode) {
      return pastEventDays;
    }

    if (isEditMode) {
      const currentEventDays =
        startDate && endDate
          ? (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24) +
            1
          : 0;
      return pastEventDays + currentEventDays;
    }

    return 0;
  }, [
    eventsFromRentalAddressWithoutTheCurrentEvent,
    isCreateMode,
    isEditMode,
    startDate,
    endDate,
  ]);

  // Check if total event days exceed 14-day limit
  const exceeds14DayLimit = React.useMemo(() => {
    if (!startDate || !endDate || isEditMode) return false;

    const newEventDays =
      differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    const totalDaysUsed = number_of_event_days_used + newEventDays;

    return totalDaysUsed > 14;
  }, [startDate, endDate, number_of_event_days_used, isEditMode]);

  // Update form validity to include 14-day limit check
  const isFormValidWithLimit = React.useMemo(() => {
    return !exceeds14DayLimit;
  }, [exceeds14DayLimit]);

  const taxSavingsData = React.useMemo(() => {
    const pastDeductions =
      eventsFromRentalAddressWithoutTheCurrentEvent?.reduce(
        (acc, event) => acc + event?.amount,
        0
      ) || 0;

    const newEventDays = isEditMode
      ? 0
      : startDate && endDate
      ? (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24) +
        1
      : 0;

    return {
      pastDeductions,
      number_of_event_days_used,
      totalEvents: 14,
      remainingEvents:
        14 - (eventsFromRentalAddressWithoutTheCurrentEvent?.length || 0),
      newEventDays,
    };
  }, [
    eventsFromRentalAddressWithoutTheCurrentEvent,
    number_of_event_days_used,
    isEditMode,
    startDate,
    endDate,
  ]);

  const defendabilityItems = React.useMemo(
    () => [
      {
        id: "description",
        title: "Description",
        subtitle: "Written notes proving an actual business event",
        completed: !!defendabilityScore.writtenNotes,
      },
      {
        id: "attendance",
        title: "Event Attendance",
        subtitle:
          "3 or more people engaged in the event (spousal partners count as 1)",
        completed: !!defendabilityScore.morePeople,
      },
      {
        id: "duration",
        title: "Event Duration",
        subtitle: "Event must last 4.5 hours or more",
        completed: !!defendabilityScore.moreDuration,
      },
      {
        id: "valuation",
        title: is_custom_plan
          ? "Custom or Manual Valuation"
          : "Digital Valuation or Manual Valuation",
        subtitle: is_custom_plan
          ? "Custom valuation provided by our team. Manual valuation provided by you."
          : "Digital or Custom comparable rental valuation documentation (supplied by us)",
        completed:
          !!defendabilityScore.digitalValuation ||
          (eventDocuments ? eventDocuments.length > 0 : false) ||
          (uploadDocuments ? uploadDocuments.length > 0 : false),
      },
      {
        id: "payment",
        title: "Money Paid to Personal",
        subtitle:
          "Rents paid by your business and funds received in your personal account",
        completed: !!moneyPaidToPersonal,
      },
    ],
    [
      defendabilityScore,
      eventDocuments,
      uploadDocuments,
      moneyPaidToPersonal,
      is_custom_plan,
    ]
  );

  const completedCount = React.useMemo(() => {
    return defendabilityItems.filter((item) => item.completed).length;
  }, [defendabilityItems]);

  const handleSubmit = React.useCallback(
    async (data: EventFormData) => {
      // Handle template action separately - no need for full validation

      if (data.currentAction === "template") {
        try {
          // Filter people names to ensure they're all strings
          const peopleNames =
            data.people_names
              ?.map((p) => p.name)
              .filter((name): name is string => Boolean(name)) || [];

          // Map form values to template structure
          const templateData = {
            draft_name: data.templateName,
            title: data.title || null,
            description: data.description || null,
            people_count: data.people_count
              ? parseInt(data.people_count)
              : null,
            people_names: peopleNames.length > 0 ? peopleNames : null,
            excluded_areas: data.excluded_areas || null,
            start_time: data.start_time || null,
            end_time: data.end_time || null,
            is_manual_valuation: data.manual_valuation || false,
            is_used_as_template: true,
          };

          await createTemplate(templateData);
          toast.success("Template saved successfully!");
          return;
          router.refresh()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to save template"
          );
          return;
        }
      }

      // For book/update/draft actions, continue with normal flow
      if (data.residence !== property?.id) {
        console.log("Residence does not match the property");
        data.residence = property?.id || "";
      }

      if (data.business_address_id !== business_address_id) {
        console.log("Business address does not match the property");
        data.business_address_id = business_address_id || "";
      }

      // Skip strict validation for drafts
      const skipValidation = data.currentAction === "draft";

      if (skipValidation) {
        // For drafts, skip validation and proceed directly
        try {
          const updatedData = { ...data };

          if (data.upload_thumbnails && data.upload_thumbnails.length > 0) {
            const thumbnailUploadResult = await uploadFiles({
              files: data.upload_thumbnails,
              folder: "event-thumbnails",
            });

            if (thumbnailUploadResult.success && thumbnailUploadResult.data) {
              const newThumbnailUrls =
                thumbnailUploadResult.data.uploadedFiles.map(
                  (file) => file.url
                );
              updatedData.thumbnails = [
                ...(data.thumbnails || []),
                ...newThumbnailUrls,
              ];
            }
          } else {
            console.log("No thumbnails to upload");
          }

          if (data.upload_documents && data.upload_documents.length > 0) {
            const documentUploadResult = await uploadFiles({
              files: data.upload_documents,
              folder: "event-documents",
            });

            if (documentUploadResult.success && documentUploadResult.data) {
              const newDocuments = documentUploadResult.data.uploadedFiles.map(
                (file) => ({
                  id: file.url,
                  name: file.name,
                  url: file.url,
                  type: file.type,
                  size: file.size,
                  created_at: new Date().toISOString(),
                })
              );
              updatedData.event_documents = [
                ...(data.event_documents || []),
                ...newDocuments,
              ];
            }
          } else {
            console.log("No documents to upload");
          }

          delete updatedData.upload_thumbnails;
          delete updatedData.upload_documents;

          // Save as draft - create event with is_draft: true
          const draftData = {
            ...updatedData,
            is_draft: true,
          };
          const result = await createEvent(draftData);
          if (result.data) {
            toast.success("Draft saved successfully!");
            router.push(`/subscriber/home`);
          }
          form.reset({
            residence: property?.id || "",
            title: initialData?.title || "",
            start_date: initialData?.start_date || "",
            end_date: initialData?.end_date || "",
            start_time: initialData?.start_time || "",
            end_time: initialData?.end_time || "",
            people_count: initialData?.people_count || "",
            rental_amount:
              initialData?.rental_amount ||
              property?.avarage_value?.toString() ||
              "",
            description: initialData?.description || "",
            manual_valuation: initialData?.manual_valuation || false,
            money_paid_to_personal:
              initialData?.money_paid_to_personal || false,
            upload_documents: initialData?.upload_documents || [],
            event_documents: initialData?.event_documents || [],
            excluded_areas:
              initialData?.excluded_areas ||
              (property?.is_home_office_deduction ? "Home Office" : ""),
            thumbnails: initialData?.thumbnails || [],
            upload_thumbnails: [],
          });
          setClearTrigger(true);
        } catch (error) {
          console.error("Error uploading files or submitting form:", error);
        }
        return;
      }

      // For book/update actions, validate strictly
      const submitErrors = eventFormSubmitSchema.safeParse(data);

      if (submitErrors.success) {
        try {
          const updatedData = { ...data };

          if (data.upload_thumbnails && data.upload_thumbnails.length > 0) {
            const thumbnailUploadResult = await uploadFiles({
              files: data.upload_thumbnails,
              folder: "event-thumbnails",
            });

            if (thumbnailUploadResult.success && thumbnailUploadResult.data) {
              const newThumbnailUrls =
                thumbnailUploadResult.data.uploadedFiles.map(
                  (file) => file.url
                );
              updatedData.thumbnails = [
                ...(data.thumbnails || []),
                ...newThumbnailUrls,
              ];
            }
          } else {
            console.log("No thumbnails to upload");
          }

          if (data.upload_documents && data.upload_documents.length > 0) {
            const documentUploadResult = await uploadFiles({
              files: data.upload_documents,
              folder: "event-documents",
            });

            if (documentUploadResult.success && documentUploadResult.data) {
              const newDocuments = documentUploadResult.data.uploadedFiles.map(
                (file) => ({
                  id: file.url,
                  name: file.name,
                  url: file.url,
                  type: file.type,
                  size: file.size,
                  created_at: new Date().toISOString(),
                })
              );
              updatedData.event_documents = [
                ...(data.event_documents || []),
                ...newDocuments,
              ];
            }
          } else {
            console.log("No documents to upload");
          }

          delete updatedData.upload_thumbnails;
          delete updatedData.upload_documents;

          if (data.currentAction === "update" || isEditMode) {
            await updateEvent({
              eventId: eventId || "",
              eventData: updatedData,
            });
            router.push(`/subscriber/rental-agreement/${eventId}`);
          } else if (data.currentAction === "book" || isCreateMode) {
            const bookData = {
              ...updatedData,
              is_draft: false,
            };
            const result = await createEvent(bookData);
            if (result.data) {
              router.push(`/subscriber/rental-agreement/${result.data.id}`);
            }
          }
          form.reset({
            residence: property?.id || "",
            title: initialData?.title || "",
            start_date: initialData?.start_date || "",
            end_date: initialData?.end_date || "",
            start_time: initialData?.start_time || "",
            end_time: initialData?.end_time || "",
            people_count: initialData?.people_count || "",
            rental_amount:
              initialData?.rental_amount ||
              property?.avarage_value?.toString() ||
              "",
            description: initialData?.description || "",
            manual_valuation: initialData?.manual_valuation || false,
            money_paid_to_personal:
              initialData?.money_paid_to_personal || false,
            upload_documents: initialData?.upload_documents || [],
            event_documents: initialData?.event_documents || [],
            excluded_areas:
              initialData?.excluded_areas ||
              (property?.is_home_office_deduction ? "Home Office" : ""),
            thumbnails: initialData?.thumbnails || [],
            upload_thumbnails: [],
          });
          setClearTrigger(true);
        } catch (error) {
          console.error("Error uploading files or submitting form:", error);
        }
      } else {
        const errors = z.treeifyError(submitErrors.error);
        console.log({ errors });
        form.setError("title", {
          message: errors.properties?.title?.errors[0],
        });
        form.setError("start_date", {
          message: errors.properties?.start_date?.errors[0],
        });
        form.setError("end_date", {
          message: errors.properties?.end_date?.errors[0],
        });
        form.setError("start_time", {
          message: errors.properties?.start_time?.errors[0],
        });
        form.setError("end_time", {
          message: errors.properties?.end_time?.errors[0],
        });
        form.setError("people_count", {
          message: errors.properties?.people_count?.errors[0],
        });
        form.setError("rental_amount", {
          message: errors.properties?.rental_amount?.errors[0],
        });
        form.setError("description", {
          message: errors.properties?.description?.errors[0],
        });
        form.setError("excluded_areas", {
          message: errors.properties?.excluded_areas?.errors[0],
        });
        form.setError("manual_valuation", {
          message: errors.properties?.manual_valuation?.errors[0],
        });
        form.setError("money_paid_to_personal", {
          message: errors.properties?.money_paid_to_personal?.errors[0],
        });
        form.setError("upload_documents", {
          message: errors.properties?.upload_documents?.errors[0],
        });
        form.setError("event_documents", {
          message: errors.properties?.event_documents?.errors[0],
        });
        form.setError("thumbnails", {
          message: errors.properties?.thumbnails?.errors[0],
        });
        form.setError("upload_thumbnails", {
          message: errors.properties?.upload_thumbnails?.errors[0],
        });
      }
    },
    [
      createTemplate,
      updateEvent,
      createEvent,
      uploadFiles,
      isEditMode,
      isCreateMode,
      eventId,
      property,
      initialData,
      form,
      router,
      business_address_id,
    ]
  );

  const disabledDates = React.useMemo(() => {
    return eventsFromRentalAddress?.map((event) => ({
      from: new Date(event.start_date),
      to: new Date(event.end_date),
    }));
  }, [eventsFromRentalAddress]);

  const contextValue: EventFormContextValue = React.useMemo(
    () => ({
      mode,
      isReadOnly,
      isEditMode,
      isCreateMode,
      form,
      selectedResidence: property?.id || "",
      disabledDates,
      disabledDaysOfWeek: [],
      validationStates,
      defendabilityScore,
      property,
      clearTrigger,
      setClearTrigger,
      datePrices: datePrices || [],
      rentalAddresses: rentalAddresses || [],
      eventsFromRentalAddress,
      eventId,
    }),
    [
      mode,
      isReadOnly,
      isEditMode,
      isCreateMode,
      form,
      property,
      disabledDates,
      validationStates,
      defendabilityScore,
      clearTrigger,
      setClearTrigger,
      datePrices,
      rentalAddresses,
      eventsFromRentalAddress,
      eventId
    ]
  );

  if (isLoading) {
    return <EventFormSkeleton showSidebar={showSidebar} />;
  }

  return (
    <EventFormProvider value={contextValue}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative overflow-hidden">
        <div className="space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-54px)]">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <CardTitle className="text-xl font-bold">
                    {isCreateMode && "Create New Event"}
                    {isEditMode && "Edit Event"}
                    {isReadOnly && "Event Details"}
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon
                          className="info-icon"
                          style={{ cursor: "pointer", color: "#6b7280" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-[200px] md:max-w-sm lg:max-w-full p-0"
                      >
                        <div className="text-red-600 font-medium pl-5 pr-2 py-2 lg:text-nowrap">
                          <h6 className="">Please Note</h6>
                          <ul className="list-[circle] list-outside space-y-1 mt-3">
                            <li className="w-full">
                              The Augusta Rule doesn&apos;t work with hunting
                              cabins/camps, boats, and entertainment facilities
                            </li>
                            <li className="w-full">
                              To qualify for the Audit Defense Guarantee your
                              Defensibility Score needs to be 5/5.
                            </li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <EventDetailsSection />
                <EventTimingSection />
                <EventAttendeesSection />
                <EventRentalSection />
                <EventDescriptionSection />
                <EventAreasSection property={property!} />
                <EventPhotosSection />
                <EventFormActions
                  isValid={isFormValidWithLimit}
                  onSubmit={() => {
                    form.handleSubmit(handleSubmit)();
                  }}
                  eventId={eventId}
                />
              </CardContent>
            </Card>
          </form>
        </div>

        {showSidebar && (
          <div className="space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-54px)]">
            <TaxDeductionsCard
              taxSavingsData={taxSavingsData}
              currentEventDeduction={rentalAmount}
            />
            <DefensibilityScoreCard
              defendabilityItems={defendabilityItems}
              completedCount={completedCount}
            />
          </div>
        )}
      </div>
    </EventFormProvider>
  );
}
