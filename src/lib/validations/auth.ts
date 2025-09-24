import { z } from "zod";

// Email validation schema
export const emailSchema = z
  .email("Please enter a valid email address")
  .max(254, "Email address is too long");

// Password validation schema for signup
export const signupPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be no more than 128 characters long")
  .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/(?=.*\d)/, "Password must contain at least one number")
  .regex(
    /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
    "Password must contain at least one special character"
  );

// Password validation schema for signin (less strict)
export const signinPasswordSchema = z
  .string()
  .min(1, "Password is required");

// Form validation schemas
export const signupFormSchema = z.object({
  email: emailSchema,
  password: signupPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signinFormSchema = z.object({
  email: emailSchema,
  password: signinPasswordSchema,
});

// Reset password form schema
export const resetPasswordFormSchema = z.object({
  password: signupPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password strength calculation
export const getPasswordStrength = (password: string): { 
  score: number; 
  label: string; 
  color: string; 
} => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  
  // Character type checks
  if (/(?=.*[a-z])/.test(password)) score++;
  if (/(?=.*[A-Z])/.test(password)) score++;
  if (/(?=.*\d)/.test(password)) score++;
  if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score++;

  const strengthMap = [
    { label: "Very Weak", color: "text-red-500" },
    { label: "Weak", color: "text-red-400" },
    { label: "Fair", color: "text-yellow-500" },
    { label: "Good", color: "text-blue-500" },
    { label: "Strong", color: "text-green-500" },
  ];

  return { score, ...strengthMap[Math.min(score, 4)] };
};

// Type exports
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type SigninFormData = z.infer<typeof signinFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type AuthFormData = SignupFormData | SigninFormData;
