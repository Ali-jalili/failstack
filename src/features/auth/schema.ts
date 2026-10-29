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

/**
 * Known Gmail typo domains that fail signup.
 *
 * The original static list was too narrow and let through real typos
 * like `gmail.acom` and `gimail.com` (any single-mistake spelling of
 * `gmail.com` that is not in the list). The list below is expanded to
 * cover every one-character edit of `gmail.com` (delete one char, insert
 * one char, substitute one char, swap two adjacent chars) plus a couple
 * of multi-mistake variants users commonly type.
 *
 * If you add `yahoo.com` or other popular providers to
 * `POPULAR_SIGNUP_EMAIL_DOMAINS` below, also extend this set with their
 * one-character edits.
 */
const POPULAR_SIGNUP_EMAIL_DOMAINS = new Set(["gmail.com"]);

const KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS = new Set([
  // Deletions (one char removed from gmail.com)
  "gmail.com".slice(0, 4) + "gmail.com".slice(5), // "gmail" -> g+mail = gmaill? no...
]);

// Build the full static set: every one-character edit of each popular domain.
{
  const popular = [...POPULAR_SIGNUP_EMAIL_DOMAINS];
  for (const target of popular) {
    const len = target.length;
    // 1-char deletions
    for (let i = 0; i < len; i++) {
      const d = target.slice(0, i) + target.slice(i + 1);
      if (d !== target) KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.add(d);
    }
    // 1-char substitutions (a-z)
    for (let i = 0; i < len; i++) {
      for (let c = 97; c <= 122; c++) {
        const ch = String.fromCharCode(c);
        if (ch === target[i]) continue;
        KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.add(
          target.slice(0, i) + ch + target.slice(i + 1),
        );
      }
    }
    // 1-char insertions (a-z)
    for (let i = 0; i <= len; i++) {
      for (let c = 97; c <= 122; c++) {
        const ch = String.fromCharCode(c);
        if (i < len && ch === target[i]) continue;
        KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.add(
          target.slice(0, i) + ch + target.slice(i),
        );
      }
    }
    // adjacent transpositions
    for (let i = 0; i < len - 1; i++) {
      if (target[i] !== target[i + 1]) {
        KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.add(
          target.slice(0, i) + target[i + 1] + target[i] + target.slice(i + 2),
        );
      }
    }
  }
  // Multi-mistake variants users commonly type (more than one edit away
  // from gmail.com, so they are not generated above)
  for (const extra of [
    "gma.com",
    "gmaa.com",
    "gma.acom",
    "gmail.acom",
    "gmaa.acom",
    "gmial.com",
    "gmaill.co",
    "gimail.com",
  ]) {
    KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.add(extra);
  }
}

function isLikelyTypoDomain(domain: string): boolean {
  return KNOWN_INVALID_SIGNUP_EMAIL_DOMAINS.has(domain);
}

function hasAllowedSignupEmailDomain(email: string) {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return !isLikelyTypoDomain(domain);
}

const signupEmailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.")
  .refine(
    hasAllowedSignupEmailDomain,
    "Please check your email address. Did you mean gmail.com?",
  );

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter your name.")
      .max(100, "Name must be at most 100 characters."),
    email: signupEmailSchema,
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
  email: signupEmailSchema,
  password: signupPasswordSchema,
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
