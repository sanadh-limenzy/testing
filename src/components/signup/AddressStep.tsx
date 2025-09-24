'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import GoogleMapInput from '../ui/GoogleMapInput';
import { GoogleAddress } from '../../@types';

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

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  verified: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressStepProps {
  title: string;
  subtitle: string;
  onNext: (data: AddressFormData) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  submitButtonText?: string;
  disabled?: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  title,
  subtitle,
  onNext,
  onBack,
  loading = false,
  error,
  submitButtonText = "Continue",
  disabled = false,
}) => {
  const [useGoogleAutocomplete, setUseGoogleAutocomplete] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US' },
  });


  const handleGoogleAddressSelect = (address: GoogleAddress | Record<string, never>) => {
    // Check if it's a valid GoogleAddress object with required properties
    if (address && 'street' in address) {
      setValue('street', address.street || '');
      
      // Only update other fields if they exist (i.e., when a suggestion is selected)
      if (address.city) setValue('city', address.city);
      if (address.state) setValue('state', address.state);
      if (address.pinCode) setValue('zipCode', address.pinCode);
      if (address.country) setValue('country', address.country);
    }
  };

  const onSubmit = (data: AddressFormData) => {
    const addressData: AddressFormData = {
      ...data,
      verified: true,
    };

    onNext(addressData);
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-gray-600">{subtitle}</p>
      </div>

      <form onSubmit={disabled ? undefined : handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="street" className="text-sm font-medium text-gray-700">
              Street Address *
            </label>
            {!disabled && (
              <button
                type="button"
                onClick={() => setUseGoogleAutocomplete(!useGoogleAutocomplete)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {useGoogleAutocomplete ? 'Use manual entry' : 'Use Google autocomplete'}
              </button>
            )}
          </div>
          
          {useGoogleAutocomplete && !disabled ? (
            <GoogleMapInput
              onChange={handleGoogleAddressSelect}
              disabled={disabled}
              value={watch('street') ?? ''}
              placeholder="Search for your address..."
              mapId="address-step"
            />
          ) : (
            <Input
              id="street"
              placeholder="Enter your full street address (e.g., 123 Main Street)"
              {...register('street')}
              className="w-full"
              disabled={disabled}
            />
          )}
          
          {errors.street && (
            <p className="text-sm text-red-600">{errors.street.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="text-sm font-medium text-gray-700">
              City *
            </label>
            <Input 
              id="city" 
              placeholder="Enter city name (e.g., Atlanta)" 
              {...register('city')} 
              className="w-full"
              disabled={disabled}
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="state" className="text-sm font-medium text-gray-700">
              State *
            </label>
            <Select
              value={watch('state') ?? ''}
              onValueChange={(value) => setValue('state', value)}
              disabled={disabled}
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
            {errors.state && (
              <p className="text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
              ZIP Code *
            </label>
            <Input 
              id="zipCode" 
              placeholder="5-digit ZIP code (e.g., 30309)" 
              {...register('zipCode')} 
              className="w-full"
              minLength={5}
              maxLength={10}
              disabled={disabled}
            />
            {errors.zipCode && (
              <p className="text-sm text-red-600">{errors.zipCode.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="country" className="text-sm font-medium text-gray-700">
              Country
            </label>
            <Input 
              id="country" 
              value="US" 
              disabled 
              {...register('country')} 
              className="w-full bg-gray-50 text-gray-500"
              placeholder="United States"
            />
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
          <Button type="submit" disabled={loading || disabled} className="flex-1">
            {loading ? "Verifying..." : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
};
