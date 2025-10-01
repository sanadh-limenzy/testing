"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { ProfileNavigation } from "@/components/profile/ProfileNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { getInitials } from "@/lib/string-utils";
import { Edit3 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { userData } = useUserData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const formatPhoneNumber = (phoneCode?: string, phone?: string) => {
    if (!phoneCode || !phone) return "";
    return `(${phoneCode}) ${phone}`;
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleChangePasswordClick = () => {
    setIsChangePasswordModalOpen(true);
  };

  return (
    <div className="p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={userData?.userProfile?.profile_picture_url}
                  alt="Profile"
                />
                <AvatarFallback className="bg-primary text-white text-2xl font-semibold">
                  {getInitials(
                    userData?.userProfile?.first_name ||
                      user?.user_metadata?.first_name,
                    userData?.userProfile?.last_name ||
                      user?.user_metadata?.last_name
                  )}
                </AvatarFallback>
              </Avatar>

              {/* User Information */}
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {userData?.userProfile?.first_name ||
                      user?.user_metadata?.first_name}{" "}
                    {userData?.userProfile?.last_name ||
                      user?.user_metadata?.last_name}
                  </h2>
                  <Badge className="bg-primary text-white">Premium</Badge>
                </div>

                <p className="text-gray-700">
                  {formatPhoneNumber(
                    userData?.userProfile?.phone_code,
                    userData?.userProfile?.phone
                  )}
                </p>

                <p className="text-gray-700">
                  {userData?.userProfile?.email || user?.email}
                </p>

                <p className="text-gray-700">
                  Tax Filer:{" "}
                  <span className="font-semibold">
                    {userData?.subscriberProfile?.accountant_profile
                      ?.user_profile?.first_name &&
                    userData?.subscriberProfile?.accountant_profile
                      ?.user_profile?.last_name
                      ? userData?.subscriberProfile?.accountant_profile
                          ?.user_profile?.first_name +
                        " " +
                        userData?.subscriberProfile?.accountant_profile
                          ?.user_profile?.last_name
                      : userData?.subscriberProfile?.accountant_profile
                          ?.user_profile?.email || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleEditClick}
            >
              <Edit3 className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Change Password Button */}
          <Button
            className="bg-primary hover:bg-primary text-white"
            onClick={handleChangePasswordClick}
          >
            Change Password
          </Button>

          {/* Profile Navigation */}
          <ProfileNavigation />
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userProfile={userData?.userProfile}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      </div>
    </div>
  );
}
