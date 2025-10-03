"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { PlanDatabase } from "@/@types";
import { usePlans } from "@/hooks/usePlans";
import { useCreatePromoCode } from "@/hooks/usePromoCodes";
import Link from "next/link";

interface CreatePromoCodeFormData {
  name: string;
  code: string;
  applicable_plans: string[];
  discount_percent: number;
  start_at: string;
  expire_at?: string;
  is_delete_after_use: boolean;
  is_one_time_user: boolean;
  allowed_emails: string[];
}

interface CreatePromoCodeFormProps {
  initialPlans: Pick<PlanDatabase, "id" | "plan_type" | "title">[];
}

export function CreatePromoCodeForm({
  initialPlans,
}: CreatePromoCodeFormProps) {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeExists, setCodeExists] = useState(false);
  const [isCodeFormatValid, setIsCodeFormatValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [formData, setFormData] = useState<CreatePromoCodeFormData>({
    name: "",
    code: "",
    applicable_plans: [],
    discount_percent: 0,
    start_at: new Date().toISOString().split("T")[0],
    is_delete_after_use: false,
    is_one_time_user: false,
    allowed_emails: [],
  });

  // Fetch plans with fallback to initial plans
  const { data: plans = initialPlans } = usePlans({
    active: true,
    initialData: initialPlans,
  });

  // Create promo code mutation
  const createPromoCodeMutation = useCreatePromoCode();

  // Debounced function to check code uniqueness
  const checkCodeUniqueness = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setCodeExists(false);
      return;
    }

    setIsCheckingCode(true);
    try {
      const response = await fetch(`/api/admin/promo-codes/check-code?code=${encodeURIComponent(code.toUpperCase())}`);
      const data = await response.json();
      setCodeExists(data.exists);
    } catch (error) {
      console.error("Error checking code uniqueness:", error);
      setCodeExists(false);
    } finally {
      setIsCheckingCode(false);
    }
  }, []);

  // Debounce the code checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.code) {
        checkCodeUniqueness(formData.code);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.code, checkCodeUniqueness]);

  // Email validation
  useEffect(() => {
    if (emailInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmailValid(emailRegex.test(emailInput.trim()));
    } else {
      setIsEmailValid(true);
    }
  }, [emailInput]);

  const handleInputChange = (
    field: keyof CreatePromoCodeFormData,
    value: string | number | boolean | string[]
  ) => {
    // Special handling for code field to prevent special characters and spaces
    if (field === "code" && typeof value === "string") {
      // Remove spaces, underscores, dots, and other special characters
      // Only allow alphanumeric characters
      const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const isValid = cleanedValue.length >= 3 && /^[A-Z0-9]+$/.test(cleanedValue);
      setIsCodeFormatValid(isValid);
      
      setFormData((prev) => ({
        ...prev,
        [field]: cleanedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const generateRandomCode = async () => {
    setIsGeneratingCode(true);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codeLength = 8;
    const maxAttempts = 10; // Prevent infinite loops
    
    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let result = "";
        for (let i = 0; i < codeLength; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        try {
          // Check if code already exists
          const response = await fetch(`/api/admin/promo-codes/check-code?code=${encodeURIComponent(result)}`);
          const data = await response.json();
          
          if (!data.exists) {
            setFormData((prev) => ({ ...prev, code: result }));
            toast.success("Unique promo code generated!");
            return;
          }
        } catch (error) {
          console.error("Error checking code uniqueness:", error);
          // If check fails, use the generated code anyway
          setFormData((prev) => ({ ...prev, code: result }));
          toast.warning("Generated code (uniqueness check failed)");
          return;
        }
      }
      
      // If we couldn't find a unique code after max attempts, show error
      toast.error("Unable to generate a unique code. Please try again or enter manually.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handlePlanChange = (planId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      applicable_plans: checked
        ? [...prev.applicable_plans, planId]
        : prev.applicable_plans.filter((id) => id !== planId),
    }));
  };

  const addEmail = () => {
    const trimmedEmail = emailInput.trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (trimmedEmail && !formData.allowed_emails.includes(trimmedEmail)) {
      setFormData((prev) => ({
        ...prev,
        allowed_emails: [...prev.allowed_emails, trimmedEmail],
      }));
      setEmailInput("");
    } else if (formData.allowed_emails.includes(trimmedEmail)) {
      toast.error("This email is already added");
    }
  };

  const removeEmail = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_emails: prev.allowed_emails.filter((e) => e !== email),
    }));
  };

  const clearAllFields = () => {
    setFormData({
      name: "",
      code: "",
      applicable_plans: [],
      discount_percent: 0,
      start_at: new Date().toISOString().split("T")[0],
      is_delete_after_use: false,
      is_one_time_user: false,
      allowed_emails: [],
    });
    setEmailInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.code ||
      formData.applicable_plans.length === 0 ||
      formData.discount_percent <= 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate promo code format
    if (formData.code.length < 3) {
      toast.error("Promo code must be at least 3 characters long");
      return;
    }

    if (!/^[A-Z0-9]+$/.test(formData.code)) {
      toast.error("Promo code can only contain letters and numbers");
      return;
    }

    // Check if code already exists
    if (codeExists) {
      toast.error("Please choose a unique promo code");
      return;
    }

    // Check if code is still being validated
    if (isCheckingCode) {
      toast.error("Please wait while we validate the promo code");
      return;
    }

    // Transform data to match API expectations
    const apiData = {
      name: formData.name,
      code: formData.code,
      promo_type: (formData.allowed_emails.length > 0
        ? "Individual"
        : "All") as "All" | "Individual",
      is_flat_discount: false,
      discount_percent: formData.discount_percent,
      start_at: formData.start_at,
      expire_at: formData.expire_at || null,
      is_delete_after_use: formData.is_delete_after_use,
      is_one_time_user: formData.is_one_time_user,
      is_unlimited_promo: false,
      promo_for: formData.applicable_plans,
      allowed_emails: formData.allowed_emails,
    };

    try {
      await createPromoCodeMutation.mutateAsync(apiData);
      toast.success("Promo code created successfully!");
      router.push("/admin/promo-code");
    } catch (error) {
      console.error("Error creating promo code:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create promo code"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/admin/promo-code">
          <Button variant="ghost" asChild className="mb-4">
            <span>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Promo Codes
            </span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Promo Code
        </h1>
        <p className="text-gray-600 mt-1">
          Create a new promotional code for your customers
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Name of Your Promo Code *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter promo code name"
                className="w-full"
                required
              />
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-sm font-medium text-gray-700"
              >
                Promo Code *
              </Label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    placeholder="Enter promo code (letters and numbers only)"
                    className={`uppercase ${codeExists || !isCodeFormatValid ? 'border-red-500' : formData.code && !isCheckingCode ? 'border-green-500' : ''}`}
                    required
                  />
                  {isCheckingCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {formData.code && !isCheckingCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {codeExists || !isCodeFormatValid ? (
                        <span className="text-red-500 text-sm">✗</span>
                      ) : (
                        <span className="text-green-500 text-sm">✓</span>
                      )}
                    </div>
                  )}
                </div>
                    <Button
                      type="button"
                      onClick={generateRandomCode}
                      disabled={isGeneratingCode}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50"
                    >
                      {isGeneratingCode ? "Generating..." : "Generate a Promo Code"}
                    </Button>
              </div>
              {formData.code && !isCheckingCode && codeExists && (
                <p className="text-red-500 text-sm mt-1">
                  This promo code already exists. Please choose a different one.
                </p>
              )}
              {formData.code && !isCheckingCode && !isCodeFormatValid && (
                <p className="text-red-500 text-sm mt-1">
                  Promo code must be at least 3 characters long and contain only letters and numbers.
                </p>
              )}
              {formData.code && !isCheckingCode && !codeExists && isCodeFormatValid && (
                <p className="text-green-500 text-sm mt-1">
                  This promo code is available.
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Only letters and numbers are allowed. Special characters and spaces will be removed automatically.
              </p>
            </div>

            {/* Applicable Plans */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Code Applicable on *
              </Label>
              <div className="space-y-2">
                {plans.map(
                  (plan: Pick<PlanDatabase, "id" | "plan_type" | "title">) => (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={plan.id}
                        checked={formData.applicable_plans.includes(plan.id)}
                        onCheckedChange={(checked) =>
                          handlePlanChange(plan.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={plan.id}
                        className="text-sm text-gray-700"
                      >
                        {plan.plan_type || plan.title}
                      </Label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Discount Percent */}
            <div className="space-y-2">
              <Label
                htmlFor="discount_percent"
                className="text-sm font-medium text-gray-700"
              >
                Discount Percent *
              </Label>
              <Input
                id="discount_percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_percent || ""}
                onChange={(e) =>
                  handleInputChange(
                    "discount_percent",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                Enter a percent for your discount. All forms will be auto
                correct to a percent. Example: Entering 12.3 will result in
                12.3%
              </p>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label
                htmlFor="start_at"
                className="text-sm font-medium text-gray-700"
              >
                Start *
              </Label>
              <Input
                id="start_at"
                type="date"
                value={formData.start_at}
                onChange={(e) => handleInputChange("start_at", e.target.value)}
                className="w-full"
                required
              />
            </div>

            {/* Expire Date */}
            <div className="space-y-2">
              <Label
                htmlFor="expire_at"
                className="text-sm font-medium text-gray-700"
              >
                Expire
              </Label>
              <Input
                id="expire_at"
                type="date"
                value={formData.expire_at || ""}
                onChange={(e) =>
                  handleInputChange("expire_at", e.target.value || "")
                }
                className="w-full"
              />
            </div>

            {/* Usage Restrictions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Usage Restriction
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete_after_use"
                    checked={formData.is_delete_after_use}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "is_delete_after_use",
                        checked as boolean
                      )
                    }
                  />
                  <Label
                    htmlFor="delete_after_use"
                    className="text-sm text-gray-700"
                  >
                    Delete after first use
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="one_time_use"
                    checked={formData.is_one_time_user}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_one_time_user", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="one_time_use"
                    className="text-sm text-gray-700"
                  >
                    One time use per person
                  </Label>
                </div>
              </div>
            </div>

            {/* Allowed Emails */}
            <div className="space-y-2">
              <Label
                htmlFor="email_input"
                className="text-sm font-medium text-gray-700"
              >
                Accounts that can use this promo code
                {formData.allowed_emails.length > 0 && (
                  <span className="text-blue-600 ml-2">
                    ({formData.allowed_emails.length} email{formData.allowed_emails.length !== 1 ? 's' : ''} added)
                  </span>
                )}
              </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="email_input"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Add Email"
                      className={`flex-1 ${emailInput && !isEmailValid ? 'border-red-500' : ''}`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEmail();
                        }
                      }}
                    />
                    {emailInput && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isEmailValid ? (
                          <span className="text-green-500 text-sm">✓</span>
                        ) : (
                          <span className="text-red-500 text-sm">✗</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={addEmail}
                    disabled={!emailInput || !isEmailValid}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 disabled:opacity-50"
                  >
                    Add
                  </Button>
                </div>
                {emailInput && !isEmailValid && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter a valid email address
                  </p>
                )}
              {formData.allowed_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allowed_emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Add specific email addresses to restrict this promo code to certain users. Leave empty to allow all users.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                onClick={clearAllFields}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Clear All Fields
              </Button>
                  <Button
                    type="submit"
                    disabled={createPromoCodeMutation.isPending || codeExists || isCheckingCode || !isCodeFormatValid}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 disabled:opacity-50"
                  >
                    {createPromoCodeMutation.isPending ? "Saving..." : "Save"}
                  </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
