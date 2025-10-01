"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import {
  resetPasswordFormSchema,
  getPasswordStrength,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

export default function ResetPassword() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = watch("password");

  const passwordStrength = useMemo(() => {
    if (!watchedPassword) return null;
    return getPasswordStrength(watchedPassword);
  }, [watchedPassword]);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setFormError("root", { message: "Invalid or expired reset link" });
        return;
      }

      if (!data.session) {
        setFormError("root", { message: "No active session found" });
        return;
      }
    };

    handlePasswordReset();
  }, [setFormError]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setMessage("");
    clearErrors();

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setFormError("root", { message: error.message });
      } else {
        setMessage("Password updated successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update password";
      setFormError("root", { message: errorMessage });
    }
  };

  console.log({ passwordStrength });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">Enter your new password</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={errors.password ? "border-destructive" : ""}
                autoComplete="new-password"
              />

              {/* Password Strength Indicator */}
              {watchedPassword && passwordStrength && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score == 1
                            ? "bg-red-500"
                            : passwordStrength.score == 2
                            ? "bg-red-400"
                            : passwordStrength.score == 3
                            ? "bg-yellow-500"
                            : passwordStrength.score == 4
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.score == 1
                          ? "text-red-500"
                          : passwordStrength.score == 2
                          ? "text-red-400"
                          : passwordStrength.score == 3
                          ? "text-yellow-500"
                          : passwordStrength.score == 4
                          ? "text-blue-500"
                          : "text-green-500"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                className={errors.confirmPassword ? "border-destructive" : ""}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="text-sm text-destructive"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* General Error Message */}
            {errors.root && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  {errors.root.message}
                </p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting || !passwordStrength || passwordStrength.score <= 3
              }
              className="w-full"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>

            {/* Password strength requirement message */}
            {watchedPassword &&
              passwordStrength &&
              passwordStrength.score <= 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  Password strength must be &quot;Fair&quot; or higher to
                  continue
                </p>
              )}
          </form>
        </div>
      </div>
    </div>
  );
}
