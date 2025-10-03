"use client";

import { Home, MapPin } from "lucide-react";

interface RentalProperty {
  id: string;
  nickname?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  bedrooms?: number;
  is_default?: boolean;
}

interface RentalInfoTabProps {
  isLoading: boolean;
  rentalProperties: RentalProperty[];
}

export function RentalInfoTab({ isLoading, rentalProperties }: RentalInfoTabProps) {
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

  if (rentalProperties.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Home className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mb-4" />
        <p className="text-lg md:text-xl text-gray-600 font-medium">
          No Rental Properties Found
        </p>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          This client hasn&apos;t added any rental properties yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rentalProperties.map((property) => (
        <div
          key={property.id}
          className={`relative border-2 rounded-lg p-6 bg-white transition-all ${
            property.is_default
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          {/* Default Badge */}
          {property.is_default && (
            <div className="absolute top-4 right-4">
              <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Default
              </span>
            </div>
          )}

          {/* Property Nickname/Name */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-bold text-gray-900">
                {property.nickname || "Rental Property"}
              </h4>
            </div>
            {property.nickname && (
              <div className="w-12 h-0.5 bg-orange-500"></div>
            )}
          </div>

          {/* Address Lines */}
          <div className="space-y-2 text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">
                  {property.street || "No street address"}
                </p>
                <p>
                  {[property.city, property.state].filter(Boolean).join(", ") ||
                    "No city/state"}
                </p>
                <p>{property.zip || "No zip code"}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {property.bedrooms && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Bedrooms:</span> {property.bedrooms}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

