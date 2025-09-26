"use client";

import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useUpdateHomeOfficeDeduction } from "@/hooks/useAddress";
import { RentalAddress } from "@/@types/subscriber";
import { useRouter } from "next/navigation";

interface HomeOfficeDeductionSectionProps {
  rentalAddresses: RentalAddress[];
}

const formatAddress = (address: RentalAddress) => {
  const parts = [];

  if (address.nickname) {
    parts.push(address.nickname);
  }

  if (address.street) {
    parts.push(address.street);
  }

  if (address.city && address.state) {
    parts.push(`${address.city}, ${address.state}`);
  }

  if (address.zip) {
    parts.push(address.zip);
  }

  return parts.join(" • ");
};

export function HomeOfficeDeductionSection({
  rentalAddresses,
}: HomeOfficeDeductionSectionProps) {
  const updateHomeOfficeDeduction = useUpdateHomeOfficeDeduction();
  const router = useRouter();
  const handleToggleHomeOfficeDeduction = async (
    addressId: string,
    currentStatus: boolean
  ) => {
    try {
      await updateHomeOfficeDeduction.mutateAsync({
        addressId,
        isHomeOfficeDeduction: !currentStatus,
      });
    } catch (error) {
      console.error("Error updating home office deduction:", error);
    }
  };

  if (rentalAddresses.length === 0) {
    return (
      <Card className="p-6 bg-white shadow-sm border border-gray-200">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-orange-500 pb-1 mb-3">
              Home Office Deduction
            </h2>
            <p className="text-gray-600 text-sm">
              No rental addresses found. Add rental addresses to manage home
              office deductions.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 underline underline-offset-8 decoration-orange-500 pb-1 mb-3">
            Home Office Deduction
          </h2>
          <p className="text-gray-600 text-sm mb-2">
            Do you take a home office deduction?
          </p>
          <p className="text-gray-600 text-sm">
            Select the rental address you want to take a home office deduction
            for.
          </p>
        </div>

        {/* Rental Addresses List */}
        <div className="space-y-4">
          {rentalAddresses.map((address) => (
            <div
              key={address.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {formatAddress(address)}
                </p>
              </div>
              <div className="ml-4">
                <Switch
                  checked={address.is_home_office_deduction}
                  onCheckedChange={async () => {
                    await handleToggleHomeOfficeDeduction(
                      address.id,
                      address.is_home_office_deduction
                    );
                    router.refresh();
                  }}
                  disabled={updateHomeOfficeDeduction.isPending}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        {/* <div className="pt-4">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            disabled={updateHomeOfficeDeduction.isPending}
          >
            {updateHomeOfficeDeduction.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div> */}
      </div>
    </Card>
  );
}
