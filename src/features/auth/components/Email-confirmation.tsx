/** @format */

"use client";

import { MailCheck } from "lucide-react";

const serifClass = "[font-family:Georgia,'Times_New_Roman',serif]";

const primaryButtonClass =
  "mt-7 flex min-h-12 w-full items-center justify-between border border-[#c6e47c] bg-[#c6e47c] px-4 text-[12px] font-semibold text-[#11190a] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#dcf7a0] hover:bg-[#dcf7a0] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none";

/**
 * Confirmation state shown after a successful signup that requires email
 * verification. Rendered in place of the signup form; focus is moved to the
 * heading by the parent.
 */
export default function EmailConfirmation({
  email,
  titleRef,
  onSigninInstead,
  onRegisterAnother,
}: {
  email: string;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onSigninInstead: () => void;
  onRegisterAnother: () => void;
}) {
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
            ref={titleRef}
            tabIndex={-1}
            className={`${serifClass} mt-5 text-[clamp(2.4rem,5vw,3.4rem)] font-normal leading-[0.99] tracking-[-0.055em] text-[#f1f1e9] focus:outline-none`}
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
                  <span className="font-medium text-slate-200">{email}</span>
                  . Confirm your account, then sign in to start contributing
                  to the archive.
                </p>
                <p className="mt-3 text-[11px] text-slate-500">
                                  No link? Check your spam folder.
                                </p>
              </div>
            </div>
          </div>

          <button type="button" onClick={onSigninInstead} className={primaryButtonClass}>
            <span>Sign in</span>
            <span aria-hidden="true" className="text-[17px] font-normal">
              ↗
            </span>
          </button>

          <button
            type="button"
            onClick={onRegisterAnother}
            className="mt-4 text-[12px] text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
          >
            Register another account
          </button>
        </div>
      </div>
    </section>
  );
}
