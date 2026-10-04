/** @format */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { validateSignup, type SignupErrors } from "@/lib/validation/auth";
import { handleSignUp } from "@/app/actions/auth";

export default function SignupForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<SignupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      router.push("/");
    } catch {
      setErrors({
        form: "Something went wrong while creating your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Background Grid & Glow Patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute left-1/3 top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative flex w-full flex-col lg:flex-row">
        {/* Left Side: Form Section */}
        <div className="flex flex-1 flex-col justify-between px-6 py-10 lg:px-16 xl:px-24">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 shadow-inner group-hover:border-blue-500/50">
                <span className="font-mono text-xs font-bold text-blue-400">
                  FS
                </span>
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-100 group-hover:text-white">
                FailStack
              </span>
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-sm py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Create an account
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Join the engineering community and start documenting system
                failures.
              </p>
            </div>

            {/* OAuth GitHub Button */}
            <button
              type="button"
              className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Sign up with GitHub</span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 font-mono text-slate-500">
                  Or with email
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSignupSubmit}
              className="space-y-4"
              noValidate
            >
              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-mono font-medium uppercase text-slate-400"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Alex Morgan"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "signup-name-error" : undefined
                  }
                  onChange={() => clearError("name")}
                  className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                    errors.name
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                      : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {errors.name && (
                  <p
                    id="signup-name-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-400"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-mono font-medium uppercase text-slate-400"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="alex@company.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "signup-email-error" : undefined
                  }
                  onChange={() => clearError("email")}
                  className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                    errors.email
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                      : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                {errors.email && (
                  <p
                    id="signup-email-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-400"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-mono font-medium uppercase text-slate-400"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "signup-password-error" : undefined
                    }
                    onChange={() => clearError("password")}
                    className={`block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                      errors.password
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="signup-password-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-400"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-mono font-medium uppercase text-slate-400"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword
                        ? "signup-confirm-password-error"
                        : undefined
                    }
                    onChange={() => clearError("confirmPassword")}
                    className={`block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                      errors.confirmPassword
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="signup-confirm-password-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-400"
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Form Level Error */}
              {errors.form && (
                <p role="alert" className="text-xs font-medium text-rose-400">
                  {errors.form}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-mono">
            FAILSTACK &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right Side Showcase (Right Panel) */}
        <div className="hidden flex-1 border-l border-slate-800/80 bg-slate-900/30 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Engineering First Culture</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Turn outages into insights.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Build a culture of blameless postmortems, identify root causes,
              and protect your infrastructure from repeated failures.
            </p>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="font-mono text-xs text-blue-400">
                SYSTEM_RESILIENCE_INIT
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                STATUS: READY
              </span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
              <div className="text-slate-400">├── Blameless Postmortems</div>
              <div className="text-slate-400">├── Distributed Tracing</div>
              <div className="text-emerald-400">
                └── Automated Incident Playbooks
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
