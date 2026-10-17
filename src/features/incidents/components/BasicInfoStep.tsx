/** @format */

"use client";

import { useFormContext } from "react-hook-form";
import {
  INCIDENT_PATTERN_LABELS,
  incidentPatternSchema,
  incidentSeveritySchema,
} from "@/features/incidents/schema";
import {
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import {
  FormDateTimeField,
  FormNumberField,
  FormSectionHeading,
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "./form-fields";

const SEVERITY_OPTIONS = incidentSeveritySchema.options.map((value) => ({
  value,
  label: value,
}));

const PATTERN_OPTIONS = incidentPatternSchema.options.map((value) => ({
  value,
  label: INCIDENT_PATTERN_LABELS[value],
}));

export default function BasicInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();

  return (
    <section className="space-y-7">
      <FormSectionHeading
        title="Basic information"
        description="Capture the essentials: who, when, how long, and how severe."
      />

      <div className="space-y-5">
        <FormTextField
          id="title"
          label="Incident title"
          placeholder="e.g. Major outage in primary database cluster"
          error={errors.title?.message}
          field={register("title")}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormTextField
            id="companyName"
            label="Company / organization"
            placeholder="e.g. FailStack Inc."
            error={errors.companyName?.message}
            field={register("companyName")}
          />

          <FormSelectField
            id="severity"
            label="Severity"
            options={SEVERITY_OPTIONS}
            error={errors.severity?.message}
            field={register("severity")}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormDateTimeField
            id="occurredAt"
            label="Occurred at"
            error={errors.occurredAt?.message}
            field={register("occurredAt")}
          />

          <FormNumberField
            id="durationMinutes"
            label="Duration (minutes)"
            min={0}
            error={errors.durationMinutes?.message}
            field={register("durationMinutes", { valueAsNumber: true })}
          />
        </div>

        <FormSelectField
          id="pattern"
          label="Failure pattern"
          options={PATTERN_OPTIONS}
          error={errors.pattern?.message}
          field={register("pattern")}
        />

        <FormTextAreaField
          id="summary"
          label="Summary"
          rows={3}
          placeholder="Brief high-level overview of the incident and its impact."
          error={errors.summary?.message}
          field={register("summary")}
        />

        <FormTextField
          id="officialPostMortemUrl"
          label="Official postmortem URL"
          type="url"
          placeholder="https://status.example.com/incidents/123"
          error={errors.officialPostMortemUrl?.message}
          field={register("officialPostMortemUrl")}
        />
      </div>
    </section>
  );
}
