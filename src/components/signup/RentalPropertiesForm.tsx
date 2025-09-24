'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, useController, Control, FieldErrors } from 'react-hook-form';
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

const rentalPropertiesSchema = z.object({
  rentalProperties: z.array(z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(5, 'Valid ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    placeId: z.string().optional(),
    verified: z.boolean().optional(),
  })).min(1, 'At least one rental property is required'),
});

export type RentalPropertiesFormData = z.infer<typeof rentalPropertiesSchema>;

type RentalProperty = RentalPropertiesFormData['rentalProperties'][0];

interface RentalPropertiesFormProps {
  onNext: (data: RentalPropertiesFormData) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

interface RentalPropertyFieldProps {
  index: number;
  control: Control<RentalPropertiesFormData>;
  onRemove: () => void;
  canRemove: boolean;
  errors: FieldErrors<RentalPropertiesFormData>;
  isEditing: boolean;
  isComplete: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  watchedProperty: RentalProperty;
}

const RentalPropertyField: React.FC<RentalPropertyFieldProps> = (props) => {
  const {
    index,
    control,
    onRemove,
    canRemove,
    errors,
    isEditing,
    isComplete,
    onEdit,
    onSave,
    onCancel,
    watchedProperty,
  } = props;

  const [useGoogleAutocomplete, setUseGoogleAutocomplete] = useState(true);

  const streetController = useController({
    name: `rentalProperties.${index}.street`,
    control,
  });

  const cityController = useController({
    name: `rentalProperties.${index}.city`,
    control,
  });

  const stateController = useController({
    name: `rentalProperties.${index}.state`,
    control,
  });

  const zipCodeController = useController({
    name: `rentalProperties.${index}.zipCode`,
    control,
  });

  const countryController = useController({
    name: `rentalProperties.${index}.country`,
    control,
  });

  const handleGoogleAddressSelect = (address: GoogleAddress | Record<string, never>) => {
    if (address && 'street' in address) {
      streetController.field.onChange(address.street || '');
      
      // Only update other fields if they exist (i.e., when a suggestion is selected)
      if (address.city) cityController.field.onChange(address.city);
      if (address.state) stateController.field.onChange(address.state);
      if (address.pinCode) zipCodeController.field.onChange(address.pinCode);
      if (address.country) countryController.field.onChange(address.country);
    }
  };



  // If property is complete and not being edited, show read-only view
  if (isComplete && !isEditing) {
    return (
      <div className={`${index > 0 ? 'border-t pt-8' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Rental Property {index + 1}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onEdit}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Edit
            </button>
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {watchedProperty?.street}, {watchedProperty?.city}, {watchedProperty?.state} {watchedProperty?.zipCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${index > 0 ? 'border-t pt-8' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Rental Property {index + 1}
        </h3>
        <div className="flex items-center space-x-2">
          {isEditing && isComplete && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancel
            </button>
          )}
          {canRemove && !isEditing && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          )}
          {canRemove && isEditing && (
            <span className="text-gray-400 text-sm font-medium cursor-not-allowed">
              Remove
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Street Address */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Street Address *
            </label>
            {isEditing && (
              <button
                type="button"
                onClick={() => setUseGoogleAutocomplete(!useGoogleAutocomplete)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {useGoogleAutocomplete ? 'Use manual entry' : 'Use Google autocomplete'}
              </button>
            )}
          </div>
          
          {useGoogleAutocomplete && isEditing ? (
            <GoogleMapInput
              onChange={handleGoogleAddressSelect}
              disabled={!isEditing}
              value={streetController.field.value ?? ''}
              placeholder="Search for rental property address..."
              mapId={`rental-property-${index}`}
            />
          ) : (
            <Input
              placeholder="Enter your full street address (e.g., 123 Main Street)"
              {...streetController.field}
              className="w-full"
              disabled={!isEditing}
            />
          )}
          
          {errors?.rentalProperties?.[index]?.street && (
            <p className="text-sm text-red-600">
              {errors.rentalProperties[index]?.street?.message}
            </p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              City *
            </label>
            <Input
              placeholder="Enter city name (e.g., Atlanta)"
              {...cityController.field}
              className="w-full"
              disabled={!isEditing}
            />
            {errors?.rentalProperties?.[index]?.city && (
              <p className="text-sm text-red-600">
                {errors.rentalProperties[index]?.city?.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              State *
            </label>
            <Select
              value={stateController.field.value ?? ''}
              onValueChange={stateController.field.onChange}
              disabled={!isEditing}
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
            {errors?.rentalProperties?.[index]?.state && (
              <p className="text-sm text-red-600">
                {errors.rentalProperties[index]?.state?.message}
              </p>
            )}
          </div>
        </div>

        {/* ZIP Code and Country */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              ZIP Code *
            </label>
            <Input
              placeholder="5-digit ZIP code (e.g., 30309)"
              {...zipCodeController.field}
              className="w-full"
              minLength={5}
              maxLength={10}
              disabled={!isEditing}
            />
            {errors?.rentalProperties?.[index]?.zipCode && (
              <p className="text-sm text-red-600">
                {errors.rentalProperties[index]?.zipCode?.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Country
            </label>
            <Input
              disabled
              {...countryController.field}
              className="w-full bg-gray-50 text-gray-500"
              placeholder="United States"
            />
          </div>
        </div>

        {/* Save button for editing mode */}
        {isEditing && (
          <div className="flex justify-end mt-6">
            <Button
              type="button"
              onClick={onSave}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Save Property
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const RentalPropertiesForm: React.FC<RentalPropertiesFormProps> = ({
  onNext,
  onBack,
  loading = false,
  error,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(0); // Start with first property in edit mode
  const [completedProperties, setCompletedProperties] = useState<Set<number>>(new Set());

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RentalPropertiesFormData>({
    resolver: zodResolver(rentalPropertiesSchema),
    defaultValues: {
      rentalProperties: [
        {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rentalProperties',
  });

  const watchedFields = watch('rentalProperties');

  const handleAddProperty = () => {
    const newIndex = fields.length;
    append({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    });
    setEditingIndex(newIndex); // Set the new property as the one being edited
  };

  const handleRemoveProperty = (index: number) => {
    if (fields.length > 1) {
      console.log('Removing property at index:', index);
      console.log('Current completed properties:', Array.from(completedProperties));
      console.log('Current editing index:', editingIndex);
      
      remove(index);
      
      // Update completed properties set - shift indices down for properties after the removed one
      const newCompletedProperties = new Set<number>();
      completedProperties.forEach(i => {
        if (i < index) {
          // Properties before the removed one keep their index
          newCompletedProperties.add(i);
        } else if (i > index) {
          // Properties after the removed one get their index decremented
          newCompletedProperties.add(i - 1);
        }
        // Property at the removed index is not added (effectively deleted)
      });
      
      console.log('New completed properties:', Array.from(newCompletedProperties));
      setCompletedProperties(newCompletedProperties);
      
      // Update editing index
      let newEditingIndex = editingIndex;
      if (editingIndex === index) {
        // If we were editing the removed property, stop editing
        newEditingIndex = null;
      } else if (editingIndex !== null && editingIndex > index) {
        // If we were editing a property after the removed one, adjust the index
        newEditingIndex = editingIndex - 1;
      }
      // If we were editing a property before the removed one, no change needed
      
      console.log('New editing index:', newEditingIndex);
      setEditingIndex(newEditingIndex);
    }
  };

  const handleEditProperty = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveProperty = (index: number) => {
    // Validate the current property using the same logic as isPropertyComplete
    if (isPropertyComplete(index)) {
      setCompletedProperties(prev => new Set(prev).add(index));
      setEditingIndex(null);
    } else {
      // Could add error handling here if needed
      console.log('Property is not complete - missing required fields');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    // Note: We don't need to restore the completed state here since
    // we're using the completedProperties set to track completion
  };

  const isPropertyComplete = (index: number) => {
    const property = watchedFields[index];
    return Boolean(
      property && 
      property.street && 
      property.street.trim() !== '' &&
      property.city && 
      property.city.trim() !== '' &&
      property.state && 
      property.state.trim() !== '' &&
      property.zipCode && 
      property.zipCode.trim() !== ''
    );
  };

  const onSubmit = (data: RentalPropertiesFormData) => {
    onNext(data);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Rental Properties</h2>
        <p className="mt-2 text-gray-600">Add your rental/business property addresses</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <RentalPropertyField
            key={field.id}
            index={index}
            control={control}
            onRemove={() => handleRemoveProperty(index)}
            canRemove={fields.length > 1}
            errors={errors}
            isEditing={editingIndex === index}
            isComplete={completedProperties.has(index)}
            onEdit={() => handleEditProperty(index)}
            onSave={() => handleSaveProperty(index)}
            onCancel={handleCancelEdit}
            watchedProperty={watchedFields[index]}
          />
        ))}

        <div className="flex flex-col items-center space-y-2">
          <button
            type="button"
            onClick={handleAddProperty}
            disabled={editingIndex !== null}
            className={`font-medium ${
              editingIndex !== null
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-primary hover:underline'
            }`}
          >
            + Add Another Property
          </button>
          {editingIndex !== null && (
            <p className="text-sm text-gray-500">
              Save the current property to add or edit others
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        {errors.rentalProperties?.root && (
          <div className="text-red-600 text-sm text-center">
            {errors.rentalProperties.root.message}
          </div>
        )}

        <div className="flex space-x-4 pt-6 border-t">
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
          <Button 
            type="submit" 
            disabled={loading || editingIndex !== null} 
            className="flex-1"
          >
            {loading ? "Saving..." : "Continue to Business Info"}
          </Button>
        </div>
      </form>
    </div>
  );
};
