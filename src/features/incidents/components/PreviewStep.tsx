/** @format */

"use client";

import { useFormContext } from "react-hook-form";
import type { IncidentFormValues } from "@/features/incidents/form-schema";
import {
  ArchitectureSection,
  BasicInfoSection,
  PreventionSection,
  RootCauseSection,
  SystemSection,
  TimelineSection,
} from "./preview/PreviewSections";

/**
 * QA final-review step.
 *
 * A single read-only pass over the complete report, driven entirely by the
 * existing React Hook Form state (`form.watch()`). It never writes anything:
 * it has no inputs, no schema, and no persistence — it only mirrors what the
 * author has entered so far and lets them confirm or go back to edit.
 */
export default function PreviewStep() {
  const values = useFormContext<IncidentFormValues>().watch();

  return (
    <div
      aria-label="Incident report preview"
      role="region"
      className="space-y-4"
    >
      {/* warm eyebrow banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#e2a16d]/25 bg-gradient-to-r from-[#e2a16d]/[0.07] via-[#e2a16d]/[0.04] to-transparent px-5 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent"
        />
        <p className="relative font-mono text-[9px] uppercase leading-[1.6] tracking-[0.14em] text-[#e2a16d]">
          Final review
        </p>
        <p className="relative mt-1.5 text-[13px] leading-[1.6] text-slate-300">
          Check the report below. You can still{" "}
          <span className="font-medium text-slate-100">go back and edit</span>{" "}
          any section — nothing is saved until you confirm.
        </p>
      </div>

      <BasicInfoSection
        title={values.title}
        companyName={values.companyName}
        occurredAt={values.occurredAt}
        durationMinutes={values.durationMinutes}
        severity={values.severity}
        pattern={values.pattern}
        summary={values.summary}
        officialPostMortemUrl={values.officialPostMortemUrl}
      />

      <SystemSection
        system={values.system}
        technologies={values.technologies}
      />

      <TimelineSection
        events={values.timeline}
        occurredAt={values.occurredAt}
      />

      <RootCauseSection nodes={values.rootCauseTree} />

      <ArchitectureSection diff={values.architectureDiff} />

      <PreventionSection actions={values.preventionActions} />
    </div>
  );
}
