"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import GoogleMapInput from "@/components/ui/GoogleMapInput";
import { UserProfile } from "@/@types/user";
import { GoogleAddress } from "@/@types";
import { getInitials } from "@/lib/string-utils";
import { useUpdateProfile } from "@/hooks/useUserData";
import { toast } from "sonner";
import { Info, User, Camera } from "lucide-react";

// Validation schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phoneCode: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onSave?: (formData: ProfileFormData & { profilePicture?: File }) => void;
}

type ProfilePictureOption = "default" | "custom" | "upload";

export function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  onSave,
}: EditProfileModalProps) {
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCode: "",
      phone: "",
      street: "",
      apartment: "",
      city: "",
      state: "",
      zip: "",
    },
  });

  const [selectedProfilePicture, setSelectedProfilePicture] =
    useState<ProfilePictureOption>("default");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Populate form when modal opens or userProfile changes
  useEffect(() => {
    if (isOpen && userProfile) {
      form.reset({
        firstName: userProfile.first_name || "",
        lastName: userProfile.last_name || "",
        email: userProfile.email || "",
        phoneCode: userProfile.phone_code || "",
        phone: userProfile.phone || "",
        street: userProfile.street || "",
        apartment: userProfile.apartment || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        zip: userProfile.zip || "",
      });
    }
  }, [isOpen, userProfile, form]);

  // Cleanup image preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedImage(null);
      setSelectedProfilePicture("default");
    }
  }, [isOpen]);

  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success("Profile updated successfully!");
      // Call the original onSave callback if provided (for backward compatibility)
      if (onSave) {
        onSave({
          ...data,
          profilePicture: selectedImage || undefined,
        });
      }
      onClose();
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);

      // Handle validation errors by setting them on the form
      if (
        error &&
        typeof error === "object" &&
        "details" in error &&
        Array.isArray(error.details)
      ) {
        error.details.forEach((detail: { field: string; message: string }) => {
          form.setError(detail.field as keyof ProfileFormData, {
            type: "manual",
            message: detail.message,
          });
        });
      } else {
        // Show a general error message
        const errorMessage =
          error && typeof error === "object" && "error" in error
            ? String(error.error)
            : "Failed to update profile. Please try again.";
        toast.error(errorMessage);
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedImage(file);
      setSelectedProfilePicture("upload");

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    const fileInput = document.getElementById(
      "profile-picture-upload"
    ) as HTMLInputElement;
    fileInput?.click();
  };

  const handleAddressSelection = (
    address: GoogleAddress | Record<string, never>
  ) => {
    if (address && "street" in address) {
      form.setValue("street", address.street || "");
    }
    if (
      address &&
      "street" in address &&
      "city" in address &&
      "state" in address &&
      "pinCode" in address
    ) {
      form.setValue("apartment", "");
      form.setValue("city", address.city || "");
      form.setValue("state", address.state || "");
      form.setValue("zip", address.pinCode || "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            EDIT PERSONAL INFORMATION
          </DialogTitle>
        </DialogHeader>

        <form
          id="profile-form"
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-8 py-4 overflow-y-auto flex-1"
        >
          {/* Profile Picture Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Select a profile picture
            </h3>
            <div className="flex items-center space-x-6">
              {/* Default Avatar Option */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <Avatar className="h-16 w-16 bg-teal-600">
                    <AvatarFallback className="bg-teal-600 text-white text-lg font-semibold">
                      {getInitials(
                        form.watch("firstName"),
                        form.watch("lastName")
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button
                  variant={
                    selectedProfilePicture === "default" ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedProfilePicture("default")}
                >
                  {selectedProfilePicture === "default" ? "Selected" : "Select"}
                </Button>
              </div>

              {/* Custom Picture Option */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <Avatar className="h-16 w-16 bg-gray-200">
                    <AvatarFallback className="bg-gray-200 text-gray-500">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button
                  variant={
                    selectedProfilePicture === "custom" ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedProfilePicture("custom")}
                >
                  {selectedProfilePicture === "custom" ? "Selected" : "Select"}
                </Button>
              </div>

              {/* Upload Custom Picture Option */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className="relative cursor-pointer"
                  onClick={handleUploadClick}
                >
                  <Avatar className="h-16 w-16 bg-teal-600">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-teal-600 text-white text-xs text-center px-2">
                        Change custom picture
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                    <Camera className="h-3 w-3 text-gray-600" />
                  </div>
                </div>
                <Button
                  variant={
                    selectedProfilePicture === "upload" ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  onClick={handleUploadClick}
                >
                  {selectedProfilePicture === "upload" ? "Selected" : "Select"}
                </Button>
                {/* Hidden file input */}
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Personal Information Form */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-900">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-1"
                >
                  First Name <span className="text-red-500">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Legal names as spelled on your Birth Certificate, Tax
                        Returns, and other legal documents
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  className="bg-gray-50"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-1"
                >
                  Last Name <span className="text-red-500">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Legal names as spelled on your Birth Certificate, Tax
                        Returns, and other legal documents
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  className="bg-gray-50"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Personal Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Personal Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-gray-50"
                  disabled
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="phoneCode"
                    {...form.register("phoneCode")}
                    placeholder="+1"
                    className="bg-gray-50 w-20"
                    disabled={
                      !!(form.watch("phoneCode") && form.watch("phone"))
                    }
                  />
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="(110) 194-5184"
                    className="bg-gray-50 flex-1"
                    disabled={
                      !!(form.watch("phoneCode") && form.watch("phone"))
                    }
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Address Information
                </h3>

                {/* Google Map Search */}
                <div className="space-y-2">
                  <Label
                    htmlFor="street"
                    className="text-sm font-medium text-gray-700"
                  >
                    Street Address
                  </Label>
                  <GoogleMapInput
                    value={form.watch("street")}
                    onChange={handleAddressSelection}
                    placeholder="Search for your address to auto-fill fields below..."
                    mapId="profile-address"
                  />
                  <p className="text-xs text-gray-500">
                    Search for an address to automatically populate the fields
                    below
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Apartment */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="apartment"
                      className="text-sm font-medium text-gray-700"
                    >
                      Apartment/Suite (Optional)
                    </Label>
                    <Input
                      id="apartment"
                      {...form.register("apartment")}
                      placeholder="Apt 4B"
                      className="bg-gray-50"
                    />
                  </div>

                  {/* City and State Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className="text-sm font-medium text-gray-700"
                      >
                        City
                      </Label>
                      <Input
                        id="city"
                        {...form.register("city")}
                        placeholder="New York"
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className="text-sm font-medium text-gray-700"
                      >
                        State
                      </Label>
                      <Input
                        id="state"
                        {...form.register("state")}
                        placeholder="NY"
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="zip"
                      className="text-sm font-medium text-gray-700"
                    >
                      ZIP Code
                    </Label>
                    <Input
                      id="zip"
                      {...form.register("zip")}
                      placeholder="10001"
                      className="bg-gray-50 w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateProfileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
