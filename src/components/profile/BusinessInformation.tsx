"use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { useBusinessAddresses, useSetDefaultAddress } from "@/hooks/useAddress";
import { AddressInformationInProfilePageSkeleton } from "@/components/skeletons/AddressInformationInProfilePageSkeleton";
import { ChangeDefaultAddressModal } from "./ChangeDefaultAddressModal";
import { useState } from "react";

export function BusinessInformation() {
  const {
    data: businessAddressesData,
    isLoading,
    error,
  } = useBusinessAddresses();

  const setDefaultMutation = useSetDefaultAddress();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    id: string;
    business_name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null>(null);

  const handleSelectDefault = (address: {
    id: string;
    business_name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    is_default?: boolean;
  }) => {
    // Don't show modal if it's already the default
    if (address.is_default) return;
    
    setSelectedAddress({
      id: address.id,
      business_name: address.business_name,
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
    });
    setModalOpen(true);
  };

  const handleConfirmDefault = async () => {
    if (!selectedAddress) return;
    
    try {
      await setDefaultMutation.mutateAsync({ 
        addressId: selectedAddress.id, 
        addressType: "business" 
      });
      setModalOpen(false);
      setSelectedAddress(null);
    } catch (error) {
      console.error("Failed to set default address:", error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAddress(null);
  };

  if (isLoading) {
    return <AddressInformationInProfilePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Select a default business or business address
          </h3>
          <p className="text-gray-700 text-sm">
            You can have unlimited businesses or business addresses. Keep in
            mind that a residence you own can only be rented out for a total of
            14 times.
          </p>
        </div>
        <Button
          className="rounded-lg px-4 py-2 h-10 w-10 p-0"
          size="sm"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Business Address Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading business addresses...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error loading business addresses
          </div>
        ) : businessAddressesData?.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No business addresses found
          </div>
        ) : (
          businessAddressesData?.data.map((address) => (
            <div
              key={address.id}
              className={`relative border-2 rounded-lg p-4 bg-white cursor-pointer hover:shadow-md transition-all ${
                address.is_default
                  ? "border-teal-600 bg-teal-50"
                  : "border-gray-200 hover:border-teal-500"
              }`}
              onClick={() => handleSelectDefault(address)}
            >
              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement edit functionality
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>

              {/* Business Name */}
              <div className="mb-2">
                <h4 className="text-lg font-bold text-gray-900 underline decoration-orange-500 underline-offset-2">
                  {address.business_name || "Unnamed Business"}
                </h4>
              </div>

              {/* Address Lines */}
              <div className="space-y-1 text-gray-600">
                <p>
                  {[address.street, address.apartment]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {[address.city, address.state, address.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Change Default Address Modal */}
      <ChangeDefaultAddressModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDefault}
        address={selectedAddress ? {
          nickname: selectedAddress.business_name || "Unnamed Business",
          street: selectedAddress.street || "",
          city: selectedAddress.city || "",
          state: selectedAddress.state || "",
          zip: selectedAddress.zip || "",
        } : null}
        isLoading={setDefaultMutation.isPending}
      />
    </div>
  );
}
