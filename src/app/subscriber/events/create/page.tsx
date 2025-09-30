import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { TemplateSelectionWrapper } from "@/components/events/TemplateSelectionWrapper";
import { headers } from "next/headers";

interface SearchParams {
  residence?: string;
  template?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// Helper function to get the base URL for server-side fetching
function getBaseUrl() {
  // In production, use the actual domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // In development, use localhost
  return "http://localhost:3000";
}

// Server-side data fetching functions
async function fetchAddress(addressId: string | undefined) {
  if (!addressId) return null;

  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/subscriber/address/rental/${addressId}`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch address:", response.status);
      return null;
    }

    const result = await response.json();
    return result.success && result.data ? result.data : null;
  } catch (error) {
    console.error("Error fetching address:", error);
    return null;
  }
}

async function fetchBusinessAddress() {
  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/subscriber/address/business/default`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch business address:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching business address:", error);
    return null;
  }
}

async function fetchEventTemplate(templateId: string | undefined) {
  if (!templateId) return null;

  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/event-templates/${templateId}`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch template:", response.status);
      return null;
    }

    const result = await response.json();
    return result.success && result.data ? result.data : null;
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
}

async function fetchRentalAddresses() {
  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/subscriber/address/rental`, {
      headers: { cookie },
      cache: "no-cache",
    });

    if (!response.ok) {
      console.error("Failed to fetch rental addresses:", response.status);
      return [];
    }

    const result = await response.json();
    return result.success && result.data ? result.data : [];
  } catch (error) {
    console.error("Error fetching rental addresses:", error);
    return [];
  }
}

async function fetchEventTemplates() {
  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/event-templates?is_template=true`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch templates:", response.status);
      return [];
    }

    const result = await response.json();
    return result.success && result.data ? result.data : [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

async function fetchEventsFromRentalAddress(
  rentalAddressId: string | undefined
) {
  if (!rentalAddressId) return [];

  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/events/rental/${rentalAddressId}`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch events:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

async function fetchRentalAmounts(
  addressId: string | undefined,
  isCustomPlan: boolean
) {
  if (!addressId || isCustomPlan) return [];

  try {
    const baseUrl = getBaseUrl();
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(
      `${baseUrl}/api/subscriber/address/rental-amounts?rental_address_id=${addressId}`,
      {
        headers: { cookie },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch rental amounts:", response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching rental amounts:", error);
    return [];
  }
}

export default async function CreateEvent({ searchParams }: PageProps) {
  const params = await searchParams;
  const propertyId = params.residence;
  const templateId = params.template;

  // Fetch all data in parallel
  const [
    address,
    businessAddress,
    templateData,
    rentalAddresses,
    templates,
    eventsFromRentalAddress,
  ] = await Promise.all([
    fetchAddress(propertyId),
    fetchBusinessAddress(),
    fetchEventTemplate(templateId),
    fetchRentalAddresses(),
    fetchEventTemplates(),
    fetchEventsFromRentalAddress(propertyId),
  ]);

  // Fetch rental amounts after we have address data
  const rentalAmounts = await fetchRentalAmounts(
    propertyId,
    address?.is_custom_plan || false
  );

  // Transform template data to initial form data
  const templateAsInitialData = templateData
    ? {
        title: templateData.title || "",
        description: templateData.description || "",
        people_count: templateData.people_count?.toString() || "",
        start_time: templateData.start_time || "08:00",
        end_time: templateData.end_time || "13:00",
        excluded_areas: templateData.excluded_areas || "",
        manual_valuation: templateData.is_manual_valuation || false,
        people_names: (templateData.people_names || []).map((name: string) => ({
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

        {/* Template Selection */}
        <TemplateSelectionWrapper
          templates={templates}
          hasSelectedTemplate={hasSelectedTemplate}
        />

        <EventForm
          mode="create"
          property={address!}
          initialData={templateAsInitialData}
          showSidebar={true}
          eventsFromRentalAddress={eventsFromRentalAddress}
          business_address_id={businessAddress?.id || ""}
          datePrices={rentalAmounts}
          isLoading={false}
          is_custom_plan={address?.is_custom_plan || false}
          rentalAddresses={rentalAddresses}
        />
      </div>
    </div>
  );
}
