"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/useChangePassword";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

// Validation schema for password change
const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (formData: ChangePasswordFormData) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSave,
}: ChangePasswordModalProps) {
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      toast.success("Password updated successfully!");
      // Call the original onSave callback if provided (for backward compatibility)
      if (onSave) {
        onSave(data);
      }
      onClose();
    } catch (error: unknown) {
      console.error("Failed to change password:", error);
      if (
        error &&
        typeof error === "object" &&
        "details" in error &&
        Array.isArray(error.details)
      ) {
        error.details.forEach((detail: { field: string; message: string }) => {
          form.setError(detail.field as keyof ChangePasswordFormData, {
            type: "manual",
            message: detail.message,
          });
        });
      }
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    form.reset();
    onClose();
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            CHANGE PASSWORD
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-6 py-4"
        >
          {/* New Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-gray-700"
            >
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                {...form.register("newPassword")}
                className="bg-gray-50 pr-12"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.newPassword && (
              <p className="text-sm text-red-500">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...form.register("confirmPassword")}
                className="bg-gray-50 pr-12"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Update Password Button */}
          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
          >
            {changePasswordMutation.isPending
              ? "Updating..."
              : "Update Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
