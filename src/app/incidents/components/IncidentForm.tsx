/** @format */

"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import BasicInfoStep from "./BasicInfoStep";

import { useState } from "react";
import PreventionReviewStep from "./PreventionReviewStep";
import SystemTechnologiesStep from "./SystemTechnologiesStep";

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
  const [step, setStep] = useState(4);

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

  function onSubmit(data: IncidentFormValues) {
    console.log(data);
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
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-500 active:scale-[0.98]"
              >
                Submit Incident
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
