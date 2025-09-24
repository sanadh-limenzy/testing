"use client";

import { Button } from "@/components/ui";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { useSearchParams } from "next/navigation";
import {
  useEventsFromRentalAddress,
  useRentalAmounts,
  useBusinessAddress,
  useAddress,
} from "@/hooks/useEvent";
import { useEventTemplate, useEventTemplates } from "@/hooks/useEventTemplates";
import { useRentalAddresses } from "@/hooks/useAddress";
import { TemplateSelectionModal } from "@/components/events/TemplateSelectionModal";
import { useRouter } from "next/navigation";

export default function CreateEvent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get("residence");
  const templateId = searchParams.get("template");

  const {
    data: address,
    isLoading: addressLoading,
    error: addressError,
  } = useAddress(propertyId || undefined);
  const {
    data: businessAddress,
    isLoading: businessLoading,
    error: businessError,
  } = useBusinessAddress();

  const {
    data: templateData,
    isLoading: templateLoading,
    error: templateError,
  } = useEventTemplate(templateId || undefined);

  const {
    data: rentalAddressesData,
    isLoading: rentalAddressesLoading,
    error: rentalAddressesError,
  } = useRentalAddresses();

  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
  } = useEventTemplates({ isTemplate: true });

  const {
    data: eventsFromRentalAddressData,
    isLoading: rentalAddressLoading,
    error: rentalAddressError,
  } = useEventsFromRentalAddress(propertyId || undefined);

  const { data: rentalAmounts, isLoading: rentalAmountsLoading } =
    useRentalAmounts(
      (propertyId && (address?.is_custom_plan ? undefined : propertyId)) ||
        undefined
    );

  const templateAsInitialData = templateData?.data
    ? {
        title: templateData.data.title || "",
        description: templateData.data.description || "",
        people_count: templateData.data.people_count?.toString() || "",
        start_time: templateData.data.start_time || "08:00",
        end_time: templateData.data.end_time || "13:00",
        excluded_areas: templateData.data.excluded_areas || "",
        manual_valuation: templateData.data.is_manual_valuation || false,
        people_names: (templateData.data.people_names || []).map((name) => ({
          name,
        })),
        defendability_scores: {
          writtenNotes: false,
          morePeople: false,
          moreDuration: false,
          digitalValuation: false,
          moneyPaidToPersonnel: false,
          evidenceSupporting: false,
        },
      }
    : undefined;

  const handleTemplateSelect = (templateId: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('template', templateId);
    router.push(currentUrl.pathname + currentUrl.search);
  };

  if (
    addressError ||
    businessError ||
    rentalAddressError ||
    templateError ||
    rentalAddressesError ||
    templatesError
  ) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">❌</div>
              <p className="text-gray-600 mb-4">
                {templateError
                  ? "Template not found or access denied."
                  : rentalAddressesError
                  ? "Failed to load rental addresses."
                  : templatesError
                  ? "Failed to load templates."
                  : "Property not found or access denied."}
              </p>
              <Link href="/subscriber/home">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no property is selected, show address selection
  if (!propertyId) {
    const availableTemplates = templatesData?.data || [];
    const hasTemplates = availableTemplates.length > 0;
    const hasSelectedTemplate = !!templateId;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
              asChild
            >
              <Link href="/subscriber/home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Template Selection - Only show if templates are available and no template is selected */}
          {hasTemplates && !hasSelectedTemplate && (
            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Start with a Template
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose a template to pre-fill your event details.
                    </p>
                  </div>
                  <TemplateSelectionModal
                    templates={availableTemplates}
                    onTemplateSelect={handleTemplateSelect}
                  >
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Select Template
                    </Button>
                  </TemplateSelectionModal>
                </div>
              </div>
            </div>
          )}

          <EventForm
            mode="create"
            property={undefined}
            initialData={templateAsInitialData}
            showSidebar={true}
            eventsFromRentalAddress={[]}
            business_address_id={businessAddress?.id || ""}
            datePrices={[]}
            isLoading={
              businessLoading || templateLoading || rentalAddressesLoading || templatesLoading
            }
            is_custom_plan={false}
            rentalAddresses={rentalAddressesData?.data || []}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            asChild
          >
            <Link href="/subscriber/home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <EventForm
          mode="create"
          property={address!}
          initialData={templateAsInitialData}
          showSidebar={true}
          eventsFromRentalAddress={eventsFromRentalAddressData?.data || []}
          business_address_id={businessAddress?.id || ""}
          datePrices={rentalAmounts || []}
          isLoading={
            addressLoading ||
            businessLoading ||
            rentalAmountsLoading ||
            rentalAddressLoading ||
            templateLoading
          }
          is_custom_plan={address?.is_custom_plan || false}
          rentalAddresses={rentalAddressesData?.data || []}
        />
      </div>
    </div>
  );
}
