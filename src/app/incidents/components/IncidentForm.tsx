/** @format */

"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import BasicInfoStep from "./BasicInfoStep";

import { useState } from "react";
import PreventionReviewStep from "./PreventionReviewStep";
import SystemTechnologiesStep from "./SystemTechnologiesStep";
import { createIncident } from "@/app/actions/incidents";

import {
  incidentFormSchema,
  IncidentFormValues,
} from "@/lib/validation/incident-form";
import TimelineStep from "./TimelineStep";
import RootCauseArchitectureStep from "./RootCauseArchitectureStep";

const STEPS = [
  {
    id: "basic-info",
    label: "Basic Info",
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
    label: "System & Technologies",
    component: SystemTechnologiesStep,
    fields: ["system", "technologies"],
  },

  {
    id: "timeline",
    label: "Timeline",
    component: TimelineStep,
    fields: ["timeline"],
  },

  {
    id: "root-cause",
    label: "Root Cause",
    component: RootCauseArchitectureStep,
    fields: ["rootCauseTree", "architectureDiff"],
  },

  {
    id: "prevention",
    label: "Prevention",
    component: PreventionReviewStep,
    fields: ["preventionActions"],
  },
] as const;

export default function IncidentForm() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const CurrentStep = STEPS[step].component;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
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
    },
  });

  const { handleSubmit, trigger } = form;

  const next = async () => {
    if (isLast) return;

    const stepFields = STEPS[step]
      .fields as readonly (keyof IncidentFormValues)[];
    const isValid = await trigger(stepFields);

    if (isValid) {
      setStep(step + 1);
    }
  };
  const back = () => !isFirst && setStep(step - 1);

  async function onSubmit(data: IncidentFormValues) {
    if (isSubmitting) return;

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

      const result = await createIncident({ ...data, occurredAt });
      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      setSubmitSuccess(
        `Incident submitted for review. Slug: ${result.slug}`,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving the incident.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Background Grid & Glow Patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[600px] rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="relative mx-auto max-w-3xl">
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-mono text-blue-400 mb-3">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
            <span>INCIDENT_POSTMORTEM_ENGINE</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create Incident
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Document system outages, failure patterns, and postmortem analysis.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CurrentStep />
            </form>
          </FormProvider>

          {/* Stepper Navigation Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
            <button
              onClick={back}
              disabled={isFirst}
              type="button"
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
                isFirst
                  ? "border-slate-800 bg-slate-900/50 text-slate-500 opacity-50 cursor-not-allowed"
                  : "border-slate-700 bg-slate-900/50 text-slate-200 hover:border-slate-600 hover:text-white"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit(onSubmit)}
                type="button"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting for Review..." : "Submit for Review"}
              </button>
            ) : (
              <button
                onClick={next}
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98]"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {submitError && (
            <p role="alert" className="mt-4 text-sm text-rose-400">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p role="status" className="mt-4 text-sm text-emerald-400">
              {submitSuccess}
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs font-mono text-slate-600">
          FAILSTACK &copy; {new Date().getFullYear()} &bull; INCIDENT MANAGEMENT
          SYSTEM
        </div>
      </div>
    </main>
  );
}

function toIsoFromLocalDateTime(value: string) {
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
