/** @format */

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createIncident,
  updateIncidentResubmit,
} from "@/features/incidents/server/actions";
import {
  incidentFormSchema,
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import {
  StepIndicator,
  StepHeader,
  StepNav,
  StepStatusPanel,
  type StepDefinition,
} from "./steps";
import BasicInfoStep from "./BasicInfoStep";
import SystemTechnologiesStep from "./SystemTechnologiesStep";
import TimelineStep from "./TimelineStep";
import RootCauseArchitectureStep from "./RootCauseArchitectureStep";
import PreventionReviewStep from "./PreventionReviewStep";

const STEPS: readonly StepDefinition<IncidentFormValues>[] = [
  {
    id: "basic-info",
    label: "Basic info",
    description: "Essential metadata and initial impact",
    component: BasicInfoStep,
    fields: [
      "title",
      "companyName",
      "occurredAt",
      "durationMinutes",
      "severity",
      "pattern",
      "summary",
      "officialPostMortemUrl",
    ],
  },
  {
    id: "system-technologies",
    label: "System & technologies",
    description: "The system and stack involved",
    component: SystemTechnologiesStep,
    fields: ["system", "technologies"],
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Sequence of events from trigger to mitigation",
    component: TimelineStep,
    fields: ["timeline"],
  },
  {
    id: "root-cause",
    label: "Root cause & architecture",
    description: "Why it happened and what changed",
    component: RootCauseArchitectureStep,
    fields: ["rootCauseTree", "architectureDiff"],
  },
  {
    id: "prevention",
    label: "Prevention & review",
    description: "Concrete changes to stop it recurring",
    component: PreventionReviewStep,
    fields: ["preventionActions"],
  },
] as const;

const DEFAULT_VALUES: IncidentFormValues = {
  title: "",
  companyName: "",
  occurredAt: "",
  durationMinutes: 0,
  severity: "MINOR",
  pattern: "SINGLE_POINT_OF_FAILURE",
  summary: "",
  officialPostMortemUrl: "",
  system: "",
  technologies: [],
  timeline: [],
  rootCauseTree: [],
  architectureDiff: {
    beforeFix: "",
    afterFix: "",
    isFact: true,
    notes: "",
  },
  preventionActions: [],
};

function toIsoFromLocalDateTime(value: string): string | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
    match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(fraction.padEnd(3, "0")),
  };
  const localDate = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );

  if (
    localDate.getFullYear() !== parts.year ||
    localDate.getMonth() !== parts.month - 1 ||
    localDate.getDate() !== parts.day ||
    localDate.getHours() !== parts.hour ||
    localDate.getMinutes() !== parts.minute ||
    localDate.getSeconds() !== parts.second ||
    localDate.getMilliseconds() !== parts.millisecond
  ) {
    return null;
  }

  return localDate.toISOString();
}

export default function IncidentForm({
  initialValues,
  incidentId,
  mode = "create",
  reviewerNote,
}: {
  initialValues?: Partial<IncidentFormValues>;
  incidentId?: string;
  mode?: "create" | "edit";
  reviewerNote?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Synchronous guard that prevents two concurrent onSubmit invocations
  // (e.g. a double-click that slips past the isLocked state check).
  const submitLockRef = useRef(false);

  // Generate a stable idempotency key for the form session (create mode only).
  // Re-submits from the same mounted form reuse the same key, so the server
  // can deduplicate concurrent or retried requests without relying on title
  // similarity.
  const idempotencyKeyRef = useState(() =>
    mode === "create" ? crypto.randomUUID() : null,
  )[0];

  const currentStepDefinition = STEPS[step];
  const CurrentStepComponent = currentStepDefinition.component;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const isLocked = isSubmitting || hasSubmitted;
  const progressPercent = Math.round(((step + 1) / STEPS.length) * 100);

  const mergedDefaults: IncidentFormValues = {
    ...DEFAULT_VALUES,
    ...(initialValues ?? {}),
  };

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: mergedDefaults,
  });

  const { handleSubmit, trigger } = form;

  const next = async () => {
    if (isLast || isLocked) return;
    const stepFields = STEPS[step].fields;
    const isValid = await trigger(stepFields);
    if (isValid) {
      setStep(step + 1);
      setSubmitError(null);
    }
  };

  const back = () => {
    if (!isFirst && !isLocked) {
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  async function onSubmit(data: IncidentFormValues) {
    if (isLocked || submitLockRef.current) return;
    submitLockRef.current = true;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const occurredAt = toIsoFromLocalDateTime(data.occurredAt);
      if (!occurredAt) {
        setSubmitError(
          "Enter a valid local date and time for when the incident occurred.",
        );
        return;
      }

      if (mode === "edit") {
        if (!incidentId) {
          setSubmitError("Missing incident id for edit.");
          return;
        }

        const result = await updateIncidentResubmit({
          id: incidentId,
          ...data,
          occurredAt,
        });
        if (result.error) {
          setSubmitError(result.error);
          return;
        }
        setSubmitSuccess("Incident updated and resubmitted for review.");
      } else {
        const result = await createIncident(
          { ...data, occurredAt },
          idempotencyKeyRef,
        );
        if (result.error) {
          setSubmitError(result.error);
          return;
        }
        setSubmitSuccess(`Incident submitted for review. Slug: ${result.slug}`);
      }

      setHasSubmitted(true);
      // Keep the confirmation visible briefly, then return the author to
      // their report list where the new review status is available.
      setTimeout(() => router.push("/my-incidents"), 2500);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving the incident.",
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  const kickerText = mode === "edit" ? "EDIT REPORT" : "NEW REPORT";
  const headline =
    mode === "edit" ? "Edit incident report" : "New incident report";
  const subheadline =
    "Document system outages, failure patterns, and the lessons they teach.";

  return (
    <div className="incident-canvas text-slate-100">
      {/* Layered ambient background */}
      <div aria-hidden="true" className="incident-canvas-grid" />
      <div aria-hidden="true" className="incident-orb incident-orb-lime" />
      <div aria-hidden="true" className="incident-orb incident-orb-warm" />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Kicker */}
        <p className="flex items-center gap-[11px] font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-[#c6e47c]">
          <span
            aria-hidden="true"
            className="h-[7px] w-[7px] shrink-0 rotate-45 border border-[#c6e47c] bg-[#c6e47c]/20"
          />
          {kickerText}
        </p>

        {/* Heading */}
        <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.8rem)] font-normal leading-[1.02] tracking-[-0.04em] text-[#f1f1e9]">
          {headline}
        </h1>
        <p className="mt-3 max-w-lg text-[13px] leading-[1.75] text-slate-400">
          {subheadline}
        </p>

        {/* Reviewer note (edit mode only) */}
        {mode === "edit" && reviewerNote ? (
          <div className="mt-6 border-l-2 border-[#e2a16d]/50 bg-[#e2a16d]/[0.07] px-4 py-3">
            <p className="font-mono text-[9px] uppercase leading-[1.6] tracking-[0.12em] text-[#e2a16d]">
              Reviewer feedback
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.7] text-slate-300">
              {reviewerNote}
            </p>
          </div>
        ) : null}

        {/* Step indicator */}
        <div className="mt-8">
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>

        {/* Active step card */}
        <div className="incident-card-enter mt-6 border border-slate-800/80 bg-gradient-to-br from-[#0c151c] via-[#0b1219] to-[#101a1c] px-5 py-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.55)] sm:px-7 sm:py-8">
          {/* Key on step so the step-enter animation replays on each change */}
          <div key={step} className="incident-step-enter">
            <StepHeader
              step={currentStepDefinition}
              stepNumber={step + 1}
              totalSteps={STEPS.length}
              progressPercent={progressPercent}
            />

            <FormProvider {...form}>
              {/* eslint-disable-next-line react-hooks/refs -- submitLockRef is read only inside the submit event handler, not during render */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <fieldset
                  disabled={isLocked}
                  className={`mt-6 ${isLocked ? "opacity-60" : ""}`}
                >
                  <CurrentStepComponent />
                </fieldset>
              </form>
            </FormProvider>
          </div>

          {/* Navigation */}
          <div className="mt-7">
            <StepNav
              canGoBack={!isFirst}
              canProceed={!isLocked}
              isSubmitting={isSubmitting}
              isLocked={isLocked}
              isLast={isLast}
              onBack={back}
              onNext={next}
              onSubmit={() => {
                void handleSubmit(onSubmit)();
              }}
            />
          </div>

          <StepStatusPanel
            error={submitError}
            success={hasSubmitted ? submitSuccess : null}
            successActionHref={hasSubmitted ? "/my-incidents" : undefined}
            successActionLabel={hasSubmitted ? "View your reports" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
