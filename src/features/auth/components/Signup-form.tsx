/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSignupPasswordRequirements,
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schema";
import { handleSignUp } from "@/features/auth/server/actions";
import {
  ConfirmPasswordField,
  PasswordField,
  TextField,
} from "./password-field";
import EmailConfirmation from "./Email-confirmation";
import ReviewWorkflowAside from "./ReviewWorkflowAside";
import { successToastOptions } from "./auth-toast";

const serifClass = "[font-family:Georgia,'Times_New_Roman',serif]";

export default function SignupForm({ returnTo = "" }: { returnTo?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState<
    string | null
  >(null);
  const signupSubmissionLockRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const passwordRequirements = getSignupPasswordRequirements(passwordValue);
  const isBusy = isSubmitting || isNavigating;

  async function onValidSubmit(data: SignupFormValues) {
    if (signupSubmissionLockRef.current) return;

    signupSubmissionLockRef.current = true;
    setFormError(null);

    try {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("next", returnTo);

      const result = await handleSignUp(formData);

      if ("error" in result) {
        if (result.error) {
          signupSubmissionLockRef.current = false;
          setIsNavigating(false);
          setFormError(result.error);
          return;
        }

        setEmailConfirmationPending(data.email);
        return;
      }

      setIsNavigating(true);
      router.push(result.destination);
      toast.success("Account created", {
        description: "Your account is ready. Redirecting you now.",
        ...successToastOptions,
      });
    } catch {
      signupSubmissionLockRef.current = false;
      setIsNavigating(false);
      setFormError(
        "Something went wrong while creating your account. Please try again.",
      );
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
    signupSubmissionLockRef.current = false;
    reset();
    setIsNavigating(false);
    setEmailConfirmationPending(null);
    setFormError(null);
  }

  const confirmationTitleRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation heading when that view appears.
  useEffect(() => {
    if (emailConfirmationPending) {
      confirmationTitleRef.current?.focus();
    }
  }, [emailConfirmationPending]);

  if (emailConfirmationPending) {
    return (
      <EmailConfirmation
        email={emailConfirmationPending}
        titleRef={confirmationTitleRef}
        onSigninInstead={handleSigninInstead}
        onRegisterAnother={handleRegisterAnother}
      />
    );
  }

  return (
    <section className="relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] text-slate-100">
      <div aria-hidden="true" className="home-grid" />
      <div aria-hidden="true" className="auth-glow auth-glow-one" />
      <div aria-hidden="true" className="auth-glow auth-glow-two" />

      <div className="relative mx-auto grid min-h-[inherit] max-w-[1440px] lg:grid-cols-2">
        {/* Form column */}
        <div className="flex items-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="auth-rise mx-auto w-full max-w-[26rem]">
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
              <div className="auth-field" style={{ animationDelay: "100ms" }}>
                <TextField
                  id="signup-name"
                  label="Full name"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  error={errors.name?.message}
                  field={nameField}
                  onClearError={() => setFormError(null)}
                />
              </div>

              {/* Email */}
              <div className="auth-field" style={{ animationDelay: "180ms" }}>
                <TextField
                  id="signup-email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@company.com"
                  error={errors.email?.message}
                  field={emailField}
                  onClearError={() => setFormError(null)}
                />
              </div>

              {/* Password */}
              <div className="auth-field" style={{ animationDelay: "260ms" }}>
                <PasswordField
                  id="signup-password"
                  label="Password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  field={passwordField}
                  onClearError={() => setFormError(null)}
                  passwordRequirements={passwordRequirements}
                />
              </div>

              {/* Confirm Password */}
              <div className="auth-field" style={{ animationDelay: "340ms" }}>
                <ConfirmPasswordField
                  id="signup-confirm-password"
                  label="Confirm password"
                  error={errors.confirmPassword?.message}
                  field={confirmPasswordField}
                  onClearError={() => setFormError(null)}
                />
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
              <div className="auth-field" style={{ animationDelay: "420ms" }}>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="group flex min-h-12 w-full items-center justify-between border border-[#c6e47c] bg-[#c6e47c] px-4 text-[12px] font-semibold text-[#11190a] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#dcf7a0] hover:bg-[#dcf7a0] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none"
                >
                  <span>
                    {isBusy ? "Creating account..." : "Create account"}
                  </span>
                  {isBusy ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-[17px] font-normal"
                    >
                      ↗
                    </span>
                  )}
                </button>
              </div>
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
        <ReviewWorkflowAside />
      </div>
    </section>
  );
}
