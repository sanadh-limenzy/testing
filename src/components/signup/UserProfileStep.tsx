"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuthContext } from "@/contexts/AuthContext";

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Please enter a valid email"),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

interface UserProfileStepProps {
  onNext: (data: UserProfileFormData) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

export const UserProfileStep: React.FC<UserProfileStepProps> = ({
  onNext,
  onBack,
  loading = false,
  error,
}) => {
  const { user } = useAuthContext();
  const [isEmailFetched, setIsEmailFetched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
  });

  // Auto-fetch email from auth user
  useEffect(() => {
    if (user?.email && !isEmailFetched) {
      setValue('email', user.email);
      setIsEmailFetched(true);
    }
  }, [user?.email, setValue, isEmailFetched]);

  const onSubmit = (data: UserProfileFormData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Personal Information
        </h2>
        <p className="mt-2 text-gray-600">
          Let&apos;s start with your basic information
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName">First Name *</label>
            <Input
              id="firstName"
              placeholder="Enter your first name"
              {...register("firstName")}
              required
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="lastName">Last Name *</label>
            <Input
              id="lastName"
              placeholder="Enter your last name"
              {...register("lastName")}
              required
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email Address *</label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            {...register("email")}
            disabled={isEmailFetched}
            className={isEmailFetched ? "bg-gray-50" : ""}
            required
          />
          {isEmailFetched && (
            <p className="text-xs text-gray-500">
              Email automatically fetched from your account
            </p>
          )}
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
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
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};
