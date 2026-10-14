/** @format */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schema";
import { handleLogin } from "@/features/auth/server/actions";

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const serifClass = "[font-family:Georgia,'Times_New_Roman',serif]";

function inputClass(hasError: boolean, withToggle = false) {
  return `block h-11 w-full border bg-[#0b121a] px-3.5 ${
    withToggle ? "pr-11" : ""
  } text-[13px] text-slate-100 placeholder-slate-600 transition-colors focus:outline-none focus:ring-1 ${
    hasError
      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c]/70 focus:ring-[#c6e47c]/40"
  }`;
}

const toggleClass =
  "absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]";

const fieldErrorClass = "mt-1.5 text-[11px] text-rose-400";

export default function LoginForm({ returnTo = "" }: { returnTo?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submitting = isSubmitting || formIsSubmitting;

  async function onValidSubmit(data: LoginFormValues) {
    if (submitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("next", returnTo);

      const result = await handleLogin(formData);

      if (result.error) {
        setFormError(result.error);
        return;
      }

      // handleLogin redirects server-side to the destination (via next/navigation
      // `redirect`), so the router never returns here on success. This toast
      // is a defensive fallback if the redirect is intercepted locally.
      toast.success("Signed in successfully.");
    } catch {
      setFormError(
        "Something went wrong while signing in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const emailField = register("email", {
    onChange: () => setFormError(null),
  });
  const passwordField = register("password", {
    onChange: () => setFormError(null),
  });

  const signupHref = `/signup?next=${encodeURIComponent(returnTo)}`;

  return (
    <section className="relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] text-slate-100">
      <div aria-hidden="true" className="home-grid" />

      <div className="relative mx-auto grid min-h-[inherit] max-w-[1440px] lg:grid-cols-2">
        {/* Form column */}
        <div className="flex items-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="mx-auto w-full max-w-[26rem]">
            <p className="flex items-center gap-[11px] font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-[#c6e47c]">
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#c6e47c] bg-[#c6e47c]/20"
              />
              Member access
            </p>

            <h1
              className={`${serifClass} mt-5 text-[clamp(2.4rem,5vw,3.4rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#f1f1e9]`}
            >
              Welcome <em className="text-[#c6e47c]">back.</em>
            </h1>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.75] text-slate-400">
              Sign in to submit incident reports and follow their review.
            </p>

            <form
              onSubmit={handleSubmit(onValidSubmit)}
              className="mt-8 space-y-4"
              noValidate
            >
              <input type="hidden" name="next" value={returnTo} />

              {/* Email */}
              <div>
                <label htmlFor="login-email" className={labelClass}>
                  Email address
                </label>
                <div className="mt-1.5">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "login-email-error" : undefined
                    }
                    {...emailField}
                    className={inputClass(Boolean(errors.email))}
                  />
                </div>
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className={labelClass}>
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "login-password-error" : undefined
                    }
                    {...passwordField}
                    className={inputClass(Boolean(errors.password), true)}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className={toggleClass}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Form Level Error */}
              {formError && (
                <p
                  role="alert"
                  className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] leading-5 text-rose-300"
                >
                  {formError}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="group flex min-h-12 w-full items-center justify-between border border-[#c6e47c] bg-[#c6e47c] px-4 text-[12px] font-semibold text-[#11190a] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#dcf7a0] hover:bg-[#dcf7a0] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none"
              >
                <span>
                  {submitting ? "Signing in..." : "Sign in"}
                </span>
                {submitting ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <span aria-hidden="true" className="text-[17px] font-normal">
                    ↗
                  </span>
                )}
              </button>
            </form>

            <p className="mt-7 border-t border-slate-800/80 pt-5 text-[12px] text-slate-400">
              New to the archive?{" "}
              <Link
                href={signupHref}
                className="text-slate-200 underline decoration-slate-600 underline-offset-[5px] transition-colors hover:text-white hover:decoration-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Side panel: what you get when signed in */}
        <aside
          aria-label="What members can do"
          className="hidden border-l border-slate-800/80 bg-gradient-to-br from-[#0c151c] via-[#0b1219] to-[#101a1c] px-10 py-16 lg:flex lg:flex-col lg:justify-center"
        >
          <div className="mx-auto w-full max-w-md">
            <p className="flex items-center gap-[11px] font-mono text-[9px] uppercase leading-[1.6] tracking-[0.12em] text-[#9cb876]">
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#9cb876] bg-[#9cb876]/20"
              />
              Your standing as a member
            </p>
            <h2
              className={`${serifClass} mt-4 text-[clamp(2.2rem,3.6vw,3.2rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#e9ece5]`}
            >
              Pick up where
              <br />
              the work <em className="text-[#e2a16d]">left off.</em>
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.75] text-slate-400">
              Every signed-in report lands in the reviewer queue, and each one
              you file carries your name on the record.
            </p>

            <ol className="mt-9 border-t border-slate-500/20">
              {[
                {
                  label: "01 / SUBMIT",
                  title: "File a report",
                  text: "Record an incident with its timeline and root causes.",
                },
                {
                  label: "02 / FOLLOW",
                  title: "Track the review",
                  text: "Watch each submission move through the queue.",
                },
                {
                  label: "03 / RESUME",
                  title: "Answer feedback",
                  text: "Revise a requested-change report and resubmit it.",
                },
              ].map((step) => (
                <li
                  key={step.label}
                  className="border-b border-slate-500/15 py-[18px]"
                >
                  <span className="font-mono text-[8px] uppercase leading-[1.5] tracking-[0.08em] text-slate-500">
                    {step.label}
                  </span>
                  <h3
                    className={`${serifClass} mt-2 text-[21px] font-normal tracking-[-0.025em] text-[#e2e7e2]`}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[25rem] text-[11px] leading-[1.6] text-slate-400">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}
