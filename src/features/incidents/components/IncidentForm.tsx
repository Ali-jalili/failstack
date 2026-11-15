/** @format */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createIncident,
  saveDraft,
  submitDraft,
  updateIncidentResubmit,
} from "@/features/incidents/server/actions";
import { checkDuplicateTitle } from "@/features/incidents/server/title-duplicates";
import { useDuplicateTitleCheck } from "./use-duplicate-title-check";
import IncidentFormNavigation from "./IncidentFormNavigation";
import {
  DEFAULT_VALUES,
  STEPS,
  toIsoFromLocalDateTime,
} from "./incident-form-config";
import {
  incidentFormSchema,
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import {
  StepIndicator,
  StepHeader,
  StepStatusPanel,
} from "./Steps";

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
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Synchronous guard that prevents two concurrent onSubmit invocations
  // (e.g. a double-click that slips past the isLocked state check).
  const submitLockRef = useRef(false);
  const draftIncidentIdRef = useRef<string | null | undefined>(incidentId);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current !== null) {
        clearTimeout(redirectTimeoutRef.current);
      }
    },
    [],
  );

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

  // QA-015: non-blocking advisory shown when the title matches an existing
  // (published) incident title. It never disables navigation or submission,
  // and a failed check is swallowed by the hook so submission stays safe.
  const { warning: duplicateTitleWarning, runCheck: runDuplicateTitleCheck } =
    useDuplicateTitleCheck({
      mode,
      incidentId,
      getCurrentTitle: () => form.getValues("title"),
      check: checkDuplicateTitle,
    });

  const next = async () => {
    if (isLast || isLocked) return;
    const stepFields = STEPS[step].fields;
    const isValid = await trigger(stepFields);
    if (isValid) {
      setCompletedSteps((completed) =>
        completed.includes(step) ? completed : [...completed, step],
      );
      // QA-015: check the title when leaving the basic-info step. Changing
      // the title to a non-duplicate clears the warning on the next check.
      if (step === 0) {
        void runDuplicateTitleCheck(form.getValues("title"));
      }
      setStep(step + 1);
      setSubmitError(null);
    } else {
      setCompletedSteps((completed) =>
        completed.filter((completedStep) => completedStep !== step),
      );
    }
  };

  const back = () => {
    if (!isFirst && !isLocked) {
      const previousStep = step - 1;
      setCompletedSteps((completed) =>
        completed.filter((completedStep) => completedStep !== previousStep),
      );
      setStep(previousStep);
      setSubmitError(null);
    }
  };

  const goToCompletedStep = (targetStep: number) => {
    if (
      isLocked ||
      targetStep >= step ||
      !completedSteps.includes(targetStep)
    ) {
      return;
    }
    setCompletedSteps((completed) =>
      completed.filter((completedStep) => completedStep !== targetStep),
    );
    setStep(targetStep);
    setSubmitError(null);
  };

  const goToPreviousStep = (targetStep: number) => {
    if (isLocked || targetStep >= step || targetStep < 0) return;
    setCompletedSteps((completed) =>
      completed.filter((completedStep) => completedStep !== targetStep),
    );
    setStep(targetStep);
    setSubmitError(null);
  };

  const validateStep = useCallback((targetStep: number) => {
    const target = STEPS[targetStep];
    return target ? trigger(target.fields) : Promise.resolve(false);
  }, [trigger]);

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
      redirectTimeoutRef.current = setTimeout(
        () => router.push("/my-incidents"),
        2500,
      );
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

  // Save the current (possibly incomplete) form as a DRAFT. No full form
  // validation is applied — the server's draft schema is the gate. A draft
  // save never submits the incident for review.
  async function onSaveDraft() {
    if (isLocked || isSavingDraft) return;
    setIsSavingDraft(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const values = form.getValues() as Partial<IncidentFormValues>;
      const occurredAt = values.occurredAt
        ? toIsoFromLocalDateTime(values.occurredAt)
        : null;
      if (values.occurredAt && !occurredAt) {
        setSubmitError(
          "Enter a valid local date and time for when the incident occurred, or clear the field.",
        );
        return;
      }

      const payload = {
        title: values.title ?? "",
        companyName: values.companyName ?? "",
        occurredAt: occurredAt ?? "",
        durationMinutes: values.durationMinutes ?? 0,
        severity: values.severity ?? "MINOR",
        pattern: values.pattern ?? "SINGLE_POINT_OF_FAILURE",
        summary: values.summary ?? "",
        officialPostMortemUrl: values.officialPostMortemUrl ?? "",
        system: values.system ?? "",
        technologies: values.technologies ?? [],
        timeline: values.timeline ?? [],
        rootCauseTree: values.rootCauseTree ?? [],
        architectureDiff: values.architectureDiff ?? null,
        preventionActions: values.preventionActions ?? [],
      };

      const existingDraftId = draftIncidentIdRef.current;
      const result = await saveDraft(payload, existingDraftId, idempotencyKeyRef);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      if (result.incidentId) {
        draftIncidentIdRef.current = result.incidentId;
      }
      setSubmitSuccess(
        existingDraftId
          ? "Draft updated."
          : "Draft saved. You can continue editing later from My reports.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving the draft.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  // Submit a DRAFT (resume flow). The server revalidates the full report and
  // only transitions to PENDING_REVIEW when it is complete and valid.
  async function onResubmitDraft() {
    if (isLocked || submitLockRef.current || !incidentId) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = await submitDraft(incidentId);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setSubmitSuccess("Draft submitted for review.");
      setHasSubmitted(true);
      redirectTimeoutRef.current = setTimeout(
        () => router.push("/my-incidents"),
        2500,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting the draft.",
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

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
          <StepIndicator
            steps={STEPS}
            currentStep={step}
            completedSteps={completedSteps}
            onStepSelect={goToCompletedStep}
          />
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
              hideTitle={isLast}
            />

            <FormProvider {...form}>
              {/* eslint-disable-next-line react-hooks/refs -- submitLockRef is read only inside the submit event handler, not during render */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <fieldset
                  disabled={isLocked}
                  className={`mt-6 ${isLocked ? "opacity-60" : ""}`}
                >
                  <CurrentStepComponent
                    onNavigateToStep={goToPreviousStep}
                    validateStep={validateStep}
                  />
                </fieldset>
              </form>
            </FormProvider>
          </div>
          <IncidentFormNavigation
            isLast={isLast}
            isFirst={isFirst}
            isLocked={isLocked}
            isSubmitting={isSubmitting}
            isSavingDraft={isSavingDraft}
            mode={mode}
            incidentId={incidentId}
            back={back}
            next={next}
            onSaveDraft={() => void onSaveDraft()}
            onResubmitDraft={() => void onResubmitDraft()}
            onSubmit={() => void handleSubmit(onSubmit)()}
          />
          <StepStatusPanel
            error={submitError}
            success={submitSuccess}
            successActionHref={hasSubmitted ? "/my-incidents" : undefined}
            successActionLabel={hasSubmitted ? "View your reports" : undefined}
          />
          {/* QA-015: advisory duplicate-title warning. Never blocks the form. */}
          {duplicateTitleWarning ? (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 border-l-2 border-[#e2a16d]/60 bg-[#e2a16d]/[0.07] px-4 py-3"
            >
              <p className="font-mono text-[9px] uppercase leading-[1.6] tracking-[0.12em] text-[#e2a16d]">
                Title already in use
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-slate-300">
                {duplicateTitleWarning}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
