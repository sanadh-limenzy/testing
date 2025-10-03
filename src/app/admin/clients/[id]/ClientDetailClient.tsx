"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import {
  ClientHeader,
  ClientNavigationCards,
  TaxPacketTab,
  HistoryTab,
  EmptyTabContent,
  BusinessInfoTab,
  RentalInfoTab,
} from "@/components/admin/clients";
import { useTaxPackets } from "@/hooks/useTaxPackets";
import { useClientEvents } from "@/hooks/useClientEvents";
import { useClientBusinessAddresses } from "@/hooks/useClientBusinessAddresses";
import { useClientRentalProperties } from "@/hooks/useClientRentalProperties";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  addedOn: string;
  currentPlan: string;
  planStatus: "active" | "inactive";
  referredBy: string;
  status: "active" | "inactive";
  businessName?: string;
  userType: "Admin" | "Subscriber" | "Accountant" | "Vendor";
  isActive: boolean;
  isSubscriptionActive: boolean;
  planStartDate?: string;
  planEndDate?: string;
  taxPro?: string;
}

interface ClientDetailClientProps {
  client: Client;
}

export function ClientDetailClient({ client }: ClientDetailClientProps) {
  const [activeTab, setActiveTab] = useState<string>("tax-packet");

  // Fetch tax packets only when tax-packet tab is active
  const { taxPackets, isLoading: isLoadingTaxPackets } = useTaxPackets(
    client.id,
    activeTab === "tax-packet"
  );

  // Fetch events only when history tab is active
  const { events, isLoading: isLoadingEvents, refetch: refetchEvents } = useClientEvents(
    client.id,
    activeTab === "history"
  );

  // Fetch business addresses only when business-info tab is active
  const { businessAddresses, isLoading: isLoadingBusinessAddresses } = useClientBusinessAddresses(
    client.id,
    activeTab === "business-info"
  );

  // Fetch rental properties only when rental-info tab is active
  const { rentalProperties, isLoading: isLoadingRentalProperties } = useClientRentalProperties(
    client.id,
    activeTab === "rental-info"
  );

  const renderContent = () => {
    switch (activeTab) {
      case "tax-packet":
        return (
          <TaxPacketTab isLoading={isLoadingTaxPackets} taxPackets={taxPackets} />
        );
      case "history":
        return (
          <HistoryTab 
            isLoading={isLoadingEvents} 
            events={events}
            onRefetch={refetchEvents}
          />
        );
      case "business-info":
        return (
          <BusinessInfoTab
            isLoading={isLoadingBusinessAddresses}
            businessAddresses={businessAddresses}
          />
        );
      case "rental-info":
        return (
          <RentalInfoTab
            isLoading={isLoadingRentalProperties}
            rentalProperties={rentalProperties}
          />
        );
      case "referrals":
        return <EmptyTabContent icon={Send} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 md:px-6 py-4 md:py-8 font-medium">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
        </div>

        {/* Client Profile Section */}
        <div className="mb-6 md:mb-8">
          <ClientHeader client={client} />
        </div>

        {/* Navigation Cards */}
        <div className="mb-6 md:mb-8">
          <ClientNavigationCards
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
}
