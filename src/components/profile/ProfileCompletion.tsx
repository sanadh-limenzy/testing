'use client';

import React, { useState } from 'react';
import { UserProfileStep, UserProfileFormData } from '../signup/UserProfileStep';
import { AddressStep, AddressFormData } from '../signup/AddressStep';
import { BusinessStep, BusinessFormData } from '../signup/BusinessStep';
import { RentalPropertiesForm, RentalPropertiesFormData } from '../signup/RentalPropertiesForm';
import { ProfileCompletionSkeleton } from '@/components/ui/skeleton-loaders';

type ProfileStep = 'user-profile' | 'personal-address' | 'rental-addresses' | 'business';

interface ProfileCompletionProps {
  onComplete?: () => void;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<ProfileStep>('user-profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfileFormData | null>(null);
  const [personalAddress, setPersonalAddress] = useState<AddressFormData | null>(null);
  const [rentalProperties, setRentalProperties] = useState<RentalPropertiesFormData | null>(null);

  const handleUserProfile = (data: UserProfileFormData) => {
    setUserProfile(data);
    setCurrentStep('personal-address');
  };

  const handlePersonalAddress = (data: AddressFormData) => {
    setPersonalAddress(data);
    setCurrentStep('rental-addresses');
  };

  const handleRentalProperties = (data: RentalPropertiesFormData) => {
    setRentalProperties(data);
    setCurrentStep('business');
  };



  const handleBusinessInfo = async (data: BusinessFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify({
          userProfile,
          personalAddress,
          rentalAddresses: rentalProperties?.rentalProperties || [],
          businessData: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save information');
      }

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save information');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'personal-address':
        setCurrentStep('user-profile');
        break;
      case 'rental-addresses':
        setCurrentStep('personal-address');
        break;
      case 'business':
        setCurrentStep('rental-addresses');
        break;
      default:
        setCurrentStep('user-profile');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'user-profile':
        return (
          <UserProfileStep
            onNext={handleUserProfile}
            loading={loading}
            error={error}
          />
        );

      case 'personal-address':
        return (
          <AddressStep
            title="Personal Address"
            subtitle="Enter your primary residential address"
            onNext={handlePersonalAddress}
            onBack={handleBack}
            loading={loading}
            error={error}
          />
        );

      case 'rental-addresses':
        return (
          <RentalPropertiesForm
            onNext={handleRentalProperties}
            onBack={handleBack}
            loading={loading}
            error={error}
          />
        );

      case 'business':
        return (
          <BusinessStep
            onNext={handleBusinessInfo}
            onBack={handleBack}
            loading={loading}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <ProfileCompletionSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="mt-2 text-gray-600">
          Please provide additional information to get started
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <span className={currentStep === 'user-profile' ? 'text-primary font-medium' : 'text-gray-500'}>
            Profile
          </span>
          <span className={currentStep === 'personal-address' ? 'text-primary font-medium' : 'text-gray-500'}>
            Address
          </span>
          <span className={currentStep === 'rental-addresses' ? 'text-primary font-medium' : 'text-gray-500'}>
            Properties
          </span>
          <span className={currentStep === 'business' ? 'text-primary font-medium' : 'text-gray-500'}>
            Business
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-primary rounded-full transition-all duration-300"
            style={{
              width: 
                currentStep === 'user-profile' ? '25%' :
                currentStep === 'personal-address' ? '50%' :
                currentStep === 'rental-addresses' ? '75%' :
                '100%'
            }}
          />
        </div>
      </div>

      {renderStep()}
    </div>
  );
};
