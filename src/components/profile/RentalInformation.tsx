"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Home } from "lucide-react";
import { useRentalProperties, useSetDefaultAddress } from "@/hooks/useAddress";
import { AddressInformationInProfilePageSkeleton } from "@/components/skeletons/AddressInformationInProfilePageSkeleton";
import { ChangeDefaultAddressModal } from "./ChangeDefaultAddressModal";
import { useState } from "react";

export function RentalInformation() {
  const {
    data: rentalPropertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError,
    refetch: refetchProperties,
  } = useRentalProperties();

  const setDefaultMutation = useSetDefaultAddress();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    id: string;
    nickname: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);

  const handleAddResidence = () => {
    // TODO: Implement add residence functionality
    console.log("Add residence clicked");
  };

  const handleEditResidence = (residenceId: string) => {
    // TODO: Implement edit residence functionality
    console.log("Edit residence clicked:", residenceId);
  };

  const handleSelectDefault = (residence: {
    id: string;
    nickname?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    is_default: boolean;
  }) => {
    // Don't show modal if it's already the default
    if (residence.is_default) return;

    setSelectedAddress({
      id: residence.id,
      nickname: residence.nickname || "Unnamed Residence",
      street: residence.street || "",
      city: residence.city || "",
      state: residence.state || "",
      zip: residence.zip || "",
    });
    setModalOpen(true);
  };

  const handleConfirmDefault = async () => {
    if (!selectedAddress) return;

    try {
      await setDefaultMutation.mutateAsync({
        addressId: selectedAddress.id,
        addressType: "rental",
      });
      setModalOpen(false);
      setSelectedAddress(null);
    } catch (error) {
      console.error("Failed to set default address:", error);
      // You might want to show a toast notification here
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAddress(null);
  };

  // Show skeleton while loading
  if (isLoadingProperties) {
    return <AddressInformationInProfilePageSkeleton />;
  }

  // Show error state if there's an error
  if (propertiesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Select a default residence
            </h3>
            <p className="text-gray-600 mt-1">
              Remember, a residence is somewhere that has a bed, bathroom, and a
              kitchen that you live in for at least 14 days out of the entire
              year.
            </p>
          </div>
          <Button
            onClick={handleAddResidence}
            className="bg-primary hover:bg-primary/90 text-white w-10 h-10 p-0 rounded-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Failed to load rental properties. Please try again.
            </p>
            <Button
              onClick={() => refetchProperties()}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Select a default residence
          </h3>
          <p className="text-gray-600 mt-1">
            Remember, a residence is somewhere that has a bed, bathroom, and a
            kitchen that you live in for at least 14 days out of the entire
            year.
          </p>
        </div>
        <Button
          onClick={handleAddResidence}
          className="bg-primary hover:bg-primary/90 text-white w-10 h-10 p-0 rounded-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Residence Cards */}
      <div className="space-y-4">
        {rentalPropertiesData?.data.map((residence) => (
          <Card
            key={residence.id}
            className={`border-2 transition-all cursor-pointer hover:shadow-md ${
              residence.is_default
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => handleSelectDefault(residence)}
          >
            <CardContent className="px-3 py-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Residence Name */}
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {residence.nickname}
                    </h4>
                    <div className="w-12 h-0.5 bg-orange-500"></div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 text-gray-600">
                    <p className="font-medium">{residence.street}</p>
                    <p>
                      {residence.city}, {residence.state}
                    </p>
                    <p>{residence.zip}</p>
                  </div>
                </div>

                {/* Right Side - Progress and Edit Button */}
                <div className="flex items-center space-x-4">
                  {/* Progress Circle */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-8 border-primary/30 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {residence.number_of_days_used}/14
                        </div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                    </div>
                    {/* Progress ring */}
                    <div
                      className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary"
                      style={{
                        transform: `rotate(${
                          (residence.number_of_days_used / 14) * 360
                        }deg)`,
                      }}
                    ></div>
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 bg-primary/10 border-primary/20 hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditResidence(residence.id);
                    }}
                  >
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {rentalPropertiesData?.data.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No residences added yet
            </h4>
            <p className="text-gray-600 mb-4">
              Add your first residence to start tracking rental information.
            </p>
            <Button
              onClick={handleAddResidence}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Residence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Default Address Modal */}
      <ChangeDefaultAddressModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDefault}
        address={selectedAddress}
        isLoading={setDefaultMutation.isPending}
      />
    </div>
  );
}
