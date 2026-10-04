/** @format */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleSignUp } from "../actions/auth";

import { validateSignup, type SignupErrors } from "@/lib/validation/auth";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearError(field: keyof SignupErrors) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  }

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const data = {
      name: formData.get("name")?.toString().trim() ?? "",
      email: formData.get("email")?.toString().trim() ?? "",
      password: formData.get("password")?.toString() ?? "",
      confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
    };

    const validationErrors = validateSignup(data);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await handleSignUp(formData);

      if (result.error) {
        setErrors({ form: result.error });
        return;
      }

      toast.success("Your account has been created successfully.");
    } catch {
      setErrors({
        form: "Something went wrong while creating your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-14 sm:px-6 lg:py-20">
      {/* Background Ambient Glow & Lighting Effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <div className="mb-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-3 py-1.5 text-xs font-medium text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Join the engineering community
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your details below to access your dashboard.
          </p>
        </div>

        <form className="space-y-5" noValidate onSubmit={handleSignupSubmit}>
          {/* Full Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-slate-200"
            >
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              name="name"
              autoComplete="name"
              required
              placeholder="e.g. Alex Morgan"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              onChange={() => clearError("name")}
              className={`block h-12 w-full rounded-xl border bg-slate-950/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                errors.name
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-slate-700/80 focus:border-blue-500"
              }`}
            />
            {errors.name && (
              <p
                id="signup-name-error"
                role="alert"
                className="text-xs text-rose-400"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-slate-200"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              onChange={() => clearError("email")}
              className={`block h-12 w-full rounded-xl border bg-slate-950/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                errors.email
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-slate-700/80 focus:border-blue-500"
              }`}
            />
            {errors.email && (
              <p
                id="signup-email-error"
                role="alert"
                className="text-xs text-rose-400"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-slate-200"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "signup-password-error" : undefined
              }
              onChange={() => clearError("password")}
              className={`block h-12 w-full rounded-xl border bg-slate-950/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                errors.password
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-slate-700/80 focus:border-blue-500"
              }`}
            />
            {errors.password && (
              <p
                id="signup-password-error"
                role="alert"
                className="text-xs text-rose-400"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-slate-200"
            >
              Confirm password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              placeholder="Enter your password again"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? "signup-confirm-password-error"
                  : undefined
              }
              onChange={() => clearError("confirmPassword")}
              className={`block h-12 w-full rounded-xl border bg-slate-950/80 px-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:ring-4 focus:ring-blue-500/10 ${
                errors.confirmPassword
                  ? "border-rose-500/80 focus:border-rose-500"
                  : "border-slate-700/80 focus:border-blue-500"
              }`}
            />
            {errors.confirmPassword && (
              <p
                id="signup-confirm-password-error"
                role="alert"
                className="text-xs text-rose-400"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Form Level Error Message */}
          {errors.form && (
            <p role="alert" className="text-xs font-medium text-rose-400">
              {errors.form}
            </p>
          )}

          <div className="pt-1">
            <SubmitButton pending={isSubmitting} />
          </div>

          <p className="border-t border-slate-800 pt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
