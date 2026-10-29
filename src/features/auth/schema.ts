/** @format */

import { z } from "zod";

export const SIGNUP_PASSWORD_MIN_LENGTH = 6;

export function getSignupPasswordRequirements(password: string) {
  return {
    minLength: password.length >= SIGNUP_PASSWORD_MIN_LENGTH,
    hasLetter: /[A-Za-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
}

const signupPasswordSchema = z
  .string()
  .min(
    SIGNUP_PASSWORD_MIN_LENGTH,
    `Password must be at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter your name.")
      .max(100, "Name must be at most 100 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: signupPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * Server-side subset of the signup fields. confirmPassword is not sent
 * to the server action, so this schema validates only the fields the
 * server actually receives.
 */
export const signupServerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Name must be at most 100 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: signupPasswordSchema,
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
