/** @format */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { signupSchema, type SignupFormValues } from "@/features/auth/schema";
import { handleSignUp } from "@/features/auth/server/actions";

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

const reviewSteps = [
  {
    label: "01 / AUTHOR",
    title: "Document",
    text: "Submit a structured account of the incident.",
  },
  {
    label: "02 / REVIEW",
    title: "Challenge",
    text: "Reviewers can approve the report or request changes.",
  },
  {
    label: "03 / ARCHIVE",
    title: "Preserve",
    text: "Approved reports join the published incident archive.",
  },
];

export default function SignupForm({ returnTo = "" }: { returnTo?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState<
    string | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitting = isSubmitting || formIsSubmitting;

  async function onValidSubmit(data: SignupFormValues) {
    if (submitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("next", returnTo);

      const result = await handleSignUp(formData);

      if (result.error) {
        setFormError(result.error);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setEmailConfirmationPending(data.email);
        return;
      }

      toast.success("Your account has been created successfully.");
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
    } catch {
      setFormError(
        "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const nameField = register("name", {
    onChange: () => setFormError(null),
  });
  const emailField = register("email", {
    onChange: () => setFormError(null),
  });
  const passwordField = register("password", {
    onChange: () => setFormError(null),
  });
  const confirmPasswordField = register("confirmPassword", {
    onChange: () => setFormError(null),
  });

  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`;

  function handleSigninInstead() {
    router.push(loginHref);
  }

  function handleRegisterAnother() {
    reset();
    setEmailConfirmationPending(null);
    setFormError(null);
  }

  if (emailConfirmationPending) {
    return (
      <section className="relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] text-slate-100">
        <div aria-hidden="true" className="home-grid" />
        <div className="relative mx-auto flex min-h-[inherit] max-w-[1440px] items-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="mx-auto w-full max-w-[26rem]">
            <p className="flex items-center gap-[11px] font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-[#c6e47c]">
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#c6e47c] bg-[#c6e47c]/20"
              />
              Confirmation needed
            </p>

            <h1
              className={`${serifClass} mt-5 text-[clamp(2.4rem,5vw,3.4rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#f1f1e9]`}
            >
              One last step.
            </h1>

            <div
              role="status"
              className="mt-5 border border-[#c6e47c]/30 bg-[#c6e47c]/5 p-4"
            >
              <div className="flex items-start gap-3">
                <MailCheck
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#c6e47c]"
                />
                <div>
                  <p className="text-[13px] font-medium text-slate-100">
                    Check your inbox
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.7] text-slate-400">
                    We&apos;ve sent a confirmation link to{" "}
                    <span className="font-medium text-slate-200">
                      {emailConfirmationPending}
                    </span>
                    . Confirm your account, then sign in to start contributing
                    to the archive.
                  </p>
                  <p className="mt-3 text-[11px] text-slate-500">
                    No link? Check your spam folder, or wait a minute and
                    refresh this page.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSigninInstead}
              className="mt-7 flex min-h-12 w-full items-center justify-between border border-[#c6e47c] bg-[#c6e47c] px-4 text-[12px] font-semibold text-[#11190a] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#dcf7a0] hover:bg-[#dcf7a0] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
            >
              <span>Sign in</span>
              <span aria-hidden="true" className="text-[17px] font-normal">
                ↗
              </span>
            </button>

            <button
              type="button"
              onClick={handleRegisterAnother}
              className="mt-4 text-[12px] text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
            >
              Register another account
            </button>
          </div>
        </div>
      </section>
    );
  }

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
              Contribute to the archive
            </p>

            <h1
              className={`${serifClass} mt-5 text-[clamp(2.4rem,5vw,3.4rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#f1f1e9]`}
            >
              Create an <em className="text-[#c6e47c]">account.</em>
            </h1>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.75] text-slate-400">
              Submit incident reports for peer review and keep the lessons they
              teach.
            </p>

            <form
              onSubmit={handleSubmit(onValidSubmit)}
              className="mt-8 space-y-4"
              noValidate
            >
              <input type="hidden" name="next" value={returnTo} />

              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className={labelClass}>
                  Full name
                </label>
                <div className="mt-1.5">
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? "signup-name-error" : undefined
                    }
                    {...nameField}
                    className={inputClass(Boolean(errors.name))}
                  />
                </div>
                {errors.name && (
                  <p
                    id="signup-name-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className={labelClass}>
                  Email address
                </label>
                <div className="mt-1.5">
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@company.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "signup-email-error" : undefined
                    }
                    {...emailField}
                    className={inputClass(Boolean(errors.email))}
                  />
                </div>
                {errors.email && (
                  <p
                    id="signup-email-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className={labelClass}>
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "signup-password-error" : undefined
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
                    id="signup-password-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-confirm-password" className={labelClass}>
                  Confirm password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword
                        ? "signup-confirm-password-error"
                        : undefined
                    }
                    {...confirmPasswordField}
                    className={inputClass(
                      Boolean(errors.confirmPassword),
                      true,
                    )}
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={showConfirmPassword}
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className={toggleClass}
                  >
                    {showConfirmPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="signup-confirm-password-error"
                    role="alert"
                    className={fieldErrorClass}
                  >
                    {errors.confirmPassword.message}
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
                  {submitting ? "Creating account..." : "Create account"}
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
              Already have an account?{" "}
              <Link
                href={loginHref}
                className="text-slate-200 underline decoration-slate-600 underline-offset-[5px] transition-colors hover:text-white hover:decoration-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Side panel: the real review workflow */}
        <aside
          aria-label="How contributions are reviewed"
          className="hidden border-l border-slate-800/80 bg-gradient-to-br from-[#0c151c] via-[#0b1219] to-[#101a1c] px-10 py-16 lg:flex lg:flex-col lg:justify-center"
        >
          <div className="mx-auto w-full max-w-md">
            <p className="flex items-center gap-[11px] font-mono text-[9px] uppercase leading-[1.6] tracking-[0.12em] text-[#9cb876]">
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#9cb876] bg-[#9cb876]/20"
              />
              A considered path to publication
            </p>
            <h2
              className={`${serifClass} mt-4 text-[clamp(2.2rem,3.6vw,3.2rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#e9ece5]`}
            >
              Shared knowledge
              <br />
              needs <em className="text-[#e2a16d]">good review.</em>
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.75] text-slate-400">
              Every contribution enters a reviewer queue before it becomes part
              of the public archive.
            </p>

            <ol className="mt-9 border-t border-slate-500/20">
              {reviewSteps.map((step) => (
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
