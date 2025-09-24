"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@/contexts/AuthContext";
import { signinFormSchema } from "@/lib/validations/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  password: string;
};

export const LoginForm: React.FC = () => {
  const { signIn, resetPassword } = useAuthActions();
  const router = useRouter();
  const validationSchema = signinFormSchema;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const watchedEmail = watch("email");

  const onSubmit = async (data: FormData) => {
    setResetMessage("");
    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        const errorMessage = result.error?.message || "An error occurred";
        toast.error("Authentication failed", {
          description: errorMessage,
          duration: 4000,
        });
        setError("root", { message: errorMessage });
      } else {
        router.push("/");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      toast.error("Authentication failed", {
        description: errorMessage,
        duration: 4000,
      });
      setError("root", { message: errorMessage });
    }
  };

  const [resetMessage, setResetMessage] = React.useState("");

  const handleForgotPassword = async () => {
    if (!watchedEmail.trim()) {
      setError("email", { message: "Please enter your email address first" });
      return;
    }

    clearErrors();

    try {
      const result = await resetPassword(watchedEmail);
      if (result.error) {
        const errorMessage =
          result.error?.message || "Failed to send reset email";
        toast.error("Password reset failed", {
          description: errorMessage,
          duration: 4000,
        });
        setError("root", { message: errorMessage });
      } else {
        toast.success("Password reset link sent!", {
          duration: 4000,
          description: "Please check your email to reset your password.",
        });
        setResetMessage(
          "Password reset link sent to your email. Please check your inbox."
        );
      }
    } catch {
      toast.error("Password reset failed", {
        description: "Failed to send reset email. Please try again.",
        duration: 4000,
      });
      setError("root", {
        message: "Failed to send reset email. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Welcome Back</h3>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email Address
        </label>
        <Input
          required
          id="email"
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-destructive" : ""}
          autoComplete="email"
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <Input
          required
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={errors.password ? "border-destructive" : ""}
          autoComplete="current-password"
        />

        {errors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* General Error Message */}
      {errors.root && (
        <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">
            {errors.root.message}
          </p>
        </div>
      )}

      {/* Success Message */}
      {resetMessage && (
        <div className="p-2.5 rounded-md bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
            {resetMessage}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Logging in..." : "Sign In"}
      </Button>

      {/* Forgot Password Button */}
      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={handleForgotPassword}
          disabled={isSubmitting}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot Password?
        </Button>
      </div>
    </form>
  );
};
