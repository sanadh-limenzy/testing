"use client";

import { Building, MapPin } from "lucide-react";

interface BusinessAddress {
  id: string;
  business_name?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_default?: boolean;
}

interface BusinessInfoTabProps {
  isLoading: boolean;
  businessAddresses: BusinessAddress[];
}

export function BusinessInfoTab({ isLoading, businessAddresses }: BusinessInfoTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border-2 rounded-lg p-6 bg-gray-50 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (businessAddresses.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Building className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mb-4" />
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          No Business Address Found
        </p>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          This client hasn&apos;t added any business addresses yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {businessAddresses.map((address) => (
        <div
          key={address.id}
          className={`relative border-2 rounded-lg p-6 bg-white transition-all ${
            address.is_default
              ? "border-teal-600 bg-teal-50"
              : "border-gray-200"
          }`}
        >
          {/* Default Badge */}
          {address.is_default && (
            <div className="absolute top-4 right-4">
              <span className="bg-teal-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Default
              </span>
            </div>
          )}

          {/* Business Name */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-bold text-gray-900 underline decoration-orange-500 underline-offset-2">
                {address.business_name || "Unnamed Business"}
              </h4>
            </div>
          </div>

          {/* Address Lines */}
          <div className="space-y-2 text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">
                  {[address.street, address.apartment]
                    .filter(Boolean)
                    .join(", ") || "No street address"}
                </p>
                <p>
                  {[address.city, address.state, address.zip]
                    .filter(Boolean)
                    .join(", ") || "No city/state/zip"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

