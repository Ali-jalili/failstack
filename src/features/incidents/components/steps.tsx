/** @format */

import Link from "next/link";
import type { ComponentType } from "react";

export interface StepDefinition<Values> {
  id: string;
  label: string;
  description: string;
  component: ComponentType;
  fields: readonly (keyof Values)[];
}

const monoLabel =
  "font-mono text-[9px] uppercase leading-[1.6] tracking-[0.14em]";

export function StepIndicator<Values>({
  steps,
  currentStep,
}: {
  steps: readonly StepDefinition<Values>[];
  currentStep: number;
}) {
  return (
    <ol
      aria-label="Reporting steps"
      className="flex flex-wrap items-center gap-2"
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        const stateClass = isActive
          ? "border-[#c6e47c]/50 bg-[#c6e47c]/10 text-[#d5e8a5]"
          : isDone
            ? "border-slate-700 bg-slate-800/40 text-slate-300"
            : "border-slate-800 bg-slate-900/40 text-slate-500";

        return (
          <li key={step.id}>
            <span
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${stateClass}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[9px] ${
                  isActive
                    ? "border-[#c6e47c] bg-[#c6e47c] text-[#11190a]"
                    : isDone
                      ? "border-slate-500 text-slate-300"
                      : "border-slate-700 text-slate-500"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span className="text-[11px] font-medium tracking-normal normal-case">
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StepHeader<Values>({
  step,
  stepNumber,
  totalSteps,
  progressPercent,
}: {
  step: StepDefinition<Values>;
  stepNumber: number;
  totalSteps: number;
  progressPercent: number;
}) {
  return (
    <div className="border-b border-slate-800/80 pb-5">
      <p className={monoLabel}>
        <span className="text-[#c6e47c]">
          STEP {stepNumber} / {totalSteps}
        </span>
        <span className="text-slate-500" aria-hidden="true">
          {" "}
          ·
        </span>
        <span className="text-slate-400">{step.description}</span>
      </p>
      <h2 className="mt-2 text-[1.75rem] font-normal leading-[1.05] tracking-[-0.02em] text-[#f1f1e9]">
        {step.label}
      </h2>

      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${progressPercent} percent`}
        className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-slate-800/80"
      >
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-[#c6e47c] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function StepNav({
  canGoBack,
  canProceed,
  isSubmitting,
  isLocked,
  isLast,
  backLabel = "Back",
  nextLabel = "Continue",
  submitLabel = "Submit for review",
  onBack,
  onNext,
  onSubmit,
}: {
  canGoBack: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  isLocked: boolean;
  isLast: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const backClass =
    "inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-700/80 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-300 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-40";

  const actionClass =
    "inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c6e47c] bg-[#c6e47c] px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#11190a] transition-[transform,background-color,border-color] hover:-translate-y-0.5 hover:border-[#dcf7a0] hover:bg-[#dcf7a0] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-5">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack || isLocked}
        className={backClass}
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting || isLocked}
          className={actionClass}
        >
          {isSubmitting ? (
            <span
              aria-hidden="true"
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#11190a]/30 border-t-[#11190a] motion-reduce:animate-none motion-reduce:hidden"
            />
          ) : (
            <span aria-hidden="true">↗</span>
          )}
          {isSubmitting ? "Submitting…" : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isLocked}
          className={actionClass}
        >
          {nextLabel}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

export function StepStatusPanel({
  error,
  success,
  successActionHref,
  successActionLabel,
}: {
  error?: string | null;
  success?: string | null;
  successActionHref?: string;
  successActionLabel?: string;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="mt-4 border-l-2 border-rose-500/60 bg-rose-500/10 py-2 pl-3 pr-2 font-mono text-[11px] leading-[1.6] tracking-[0.02em] text-rose-300"
      >
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <div
        role="status"
        className="incident-card-enter mt-5 border border-[#c6e47c]/40 bg-[#c6e47c]/[0.12] px-5 py-4"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c6e47c]/60 bg-[#c6e47c]/20 font-mono text-[10px] text-[#d5e8a5]"
          >
            ✓
          </span>
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[#d5e8a5]">
              {success}
            </p>
            {successActionHref && successActionLabel ? (
              <Link
                href={successActionHref}
                className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#c6e47c] underline decoration-[#c6e47c]/40 underline-offset-4 transition-colors hover:text-[#dcf7a0] hover:decoration-[#dcf7a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                {successActionLabel}
                <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
            <p className="mt-2 text-[11px] leading-[1.5] text-slate-400">
              Redirecting to your reports shortly…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
