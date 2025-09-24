"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import GoogleMapInput from "../ui/GoogleMapInput";

const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z.email("Please enter a valid business email"),
  entityType: z.string().min(1, "Please select an entity type"),
  natureOfBusiness: z.string().min(1, "Nature of business is required"),
  taxFilingStatus: z.string().min(1, "Please select tax filing status"),
  estimatedIncome: z.string().min(1, "Estimated income is required"),
  // Business address fields
  businessStreet: z.string().min(1, "Business street address is required"),
  businessCity: z.string().min(1, "Business city is required"),
  businessState: z.string().min(1, "Business state is required"),
  businessZipCode: z.string().min(1, "Business ZIP code is required"),
  businessCountry: z.string().min(1, "Business country is required"),
  businessLatitude: z.number().optional(),
  businessLongitude: z.number().optional(),
});

export type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessStepProps {
  onNext: (data: BusinessFormData) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

const entityTypeOptions = [
  { value: "LLC", label: "Limited Liability Company (LLC)" },
  { value: "Corporation", label: "Corporation" },
  { value: "Partnership", label: "Partnership" },
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
];

const taxFilingStatusOptions = [
  { value: "Single", label: "Single" },
  { value: "Married Filing Jointly", label: "Married Filing Jointly" },
  { value: "Married Filing Separately", label: "Married Filing Separately" },
  { value: "Head of Household", label: "Head of Household" },
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

export const BusinessStep: React.FC<BusinessStepProps> = ({
  onNext,
  onBack,
  loading = false,
  error,
}) => {
  const [useGoogleAutocomplete, setUseGoogleAutocomplete] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: { businessCountry: 'US' },
  });

  const watchedValues = watch();

  const handleGoogleAddressSelect = (address: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (address) {
      setValue('businessStreet', address.street || '');
      setValue('businessCity', address.city || '');
      setValue('businessState', address.state || '');
      setValue('businessZipCode', address.pinCode || '');
      setValue('businessCountry', address.country || 'US');
      if (address.lat && address.lng) {
        setValue('businessLatitude', address.lat);
        setValue('businessLongitude', address.lng);
      }
    }
  };

  const onSubmit = (data: BusinessFormData) => {
    onNext(data);
  };

  console.log({watchedValues});

  console.log({errors});

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Business Information
        </h2>
        <p className="mt-2 text-gray-600">
          Tell us about your business for tax purposes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="businessName">Business Name</label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            {...register("businessName")}
            minLength={1}
            maxLength={20}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="businessEmail">Business Email</label>
          <Input
            id="businessEmail"
            type="email"
            placeholder="Enter your business email"
            {...register("businessEmail")}
            required
          />
        </div>

        <Select
          value={watch("entityType") ?? entityTypeOptions[0].value}
          onValueChange={(value) => setValue("entityType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select entity type" />
          </SelectTrigger>
          <SelectContent>
            {entityTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2">
          <label htmlFor="natureOfBusiness">Nature of Business</label>
          <Input
            id="natureOfBusiness"
            placeholder="Describe your business activities"
            {...register("natureOfBusiness")}
            minLength={1}
            maxLength={20}
            required
          />
        </div>

        <Select
          value={watch("taxFilingStatus") ?? taxFilingStatusOptions[0].value}
          onValueChange={(value) => setValue("taxFilingStatus", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tax filing status" />
          </SelectTrigger>
          <SelectContent>
            {taxFilingStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-2">
          <label htmlFor="estimatedIncome">Estimated Annual Income</label>
          <Input
            id="estimatedIncome"
            type="number"
            placeholder="Enter estimated income (USD)"
            {...register("estimatedIncome")}
            minLength={1}
            maxLength={20}
            required
          />
        </div>

        {/* Business Address Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="businessStreet" className="text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <button
                type="button"
                onClick={() => setUseGoogleAutocomplete(!useGoogleAutocomplete)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {useGoogleAutocomplete ? 'Use manual entry' : 'Use Google autocomplete'}
              </button>
            </div>
            
            {useGoogleAutocomplete ? (
              <GoogleMapInput
                onChange={handleGoogleAddressSelect}
                value={watchedValues.businessStreet ?? ''}
                placeholder="Search for your business address..."
                mapId="business-address"
              />
            ) : (
              <Input
                id="businessStreet"
                placeholder="Enter your business street address"
                {...register("businessStreet")}
                className="w-full"
              />
            )}
            
            {errors.businessStreet && (
              <p className="text-sm text-red-600">{errors.businessStreet.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="businessCity" className="text-sm font-medium text-gray-700">
                City *
              </label>
              <Input
                id="businessCity"
                placeholder="Enter city"
                {...register("businessCity")}
                className="w-full"
              />
              {errors.businessCity && (
                <p className="text-sm text-red-600">{errors.businessCity.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessState" className="text-sm font-medium text-gray-700">
                State *
              </label>
              <Select
                value={watch("businessState") ?? ''}
                onValueChange={(value) => setValue("businessState", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.businessState && (
                <p className="text-sm text-red-600">{errors.businessState.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="businessZipCode" className="text-sm font-medium text-gray-700">
                ZIP Code *
              </label>
              <Input
                id="businessZipCode"
                placeholder="Enter ZIP code"
                {...register("businessZipCode")}
                className="w-full"
              />
              {errors.businessZipCode && (
                <p className="text-sm text-red-600">{errors.businessZipCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessCountry" className="text-sm font-medium text-gray-700">
                Country *
              </label>
              <Input
                id="businessCountry"
                placeholder="Enter country"
                {...register("businessCountry")}
                className="w-full"
              />
              {errors.businessCountry && (
                <p className="text-sm text-red-600">{errors.businessCountry.message}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="flex space-x-4">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Complete Registration"}
          </Button>
        </div>
      </form>
    </div>
  );
};
