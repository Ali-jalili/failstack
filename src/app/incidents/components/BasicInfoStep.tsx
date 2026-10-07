/** @format */

"use client";

import { useFormContext } from "react-hook-form";
import {
  INCIDENT_PATTERN_LABELS,
  incidentPatternSchema,
} from "@/lib/validation/incident";
import { IncidentFormValues } from "@/lib/validation/incident-form";

export default function BasicInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();

  return (
    <section className="w-full max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Basic Information
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Provide essential metadata and initial impact metrics regarding the
          incident.
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-mono font-medium uppercase text-slate-400"
          >
            Incident Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            placeholder="e.g. Major Outage in Primary Database Cluster"
            className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
              errors.title
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>
          )}
        </div>

        {/* Company Name & Severity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="companyName"
              className="block text-xs font-mono font-medium uppercase text-slate-400"
            >
              Company / Organization
            </label>
            <input
              id="companyName"
              type="text"
              {...register("companyName")}
              placeholder="e.g. FailStack Inc."
              className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                errors.companyName
                  ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="severity"
              className="block text-xs font-mono font-medium uppercase text-slate-400"
            >
              Severity Level
            </label>
            <select
              id="severity"
              {...register("severity")}
              className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                errors.severity
                  ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
              }`}
            >
              <option value="MINOR" className="bg-slate-900 text-slate-100">
                MINOR
              </option>
              <option value="MAJOR" className="bg-slate-900 text-slate-100">
                MAJOR
              </option>
              <option value="CRITICAL" className="bg-slate-900 text-slate-100">
                CRITICAL
              </option>
            </select>
            {errors.severity && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.severity.message}
              </p>
            )}
          </div>
        </div>

        {/* Occurred At & Duration Minutes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="occurredAt"
              className="block text-xs font-mono font-medium uppercase text-slate-400"
            >
              Occurred Date
            </label>
            <input
              id="occurredAt"
              type="datetime-local"
              {...register("occurredAt")}
              className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 transition focus:bg-slate-900 focus:outline-none focus:ring-1 [color-scheme:dark] ${
                errors.occurredAt
                  ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {errors.occurredAt && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.occurredAt.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="durationMinutes"
              className="block text-xs font-mono font-medium uppercase text-slate-400"
            >
              Duration (Minutes)
            </label>
            <input
              id="durationMinutes"
              type="number"
              min={0}
              {...register("durationMinutes", { valueAsNumber: true })}
              placeholder="45"
              className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
                errors.durationMinutes
                  ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {errors.durationMinutes && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>
        </div>

        {/* Failure Pattern */}
        <div>
          <label
            htmlFor="pattern"
            className="block text-xs font-mono font-medium uppercase text-slate-400"
          >
            Failure Pattern
          </label>

          <select
            id="pattern"
            {...register("pattern")}
            className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
              errors.pattern
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
            }`}
          >
            {incidentPatternSchema.options.map((p) => (
              <option key={p} value={p}>
                {INCIDENT_PATTERN_LABELS[p]}
              </option>
            ))}
          </select>

          {errors.pattern && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.pattern.message}
            </p>
          )}
        </div>

        {/* Summary */}
        <div>
          <label
            htmlFor="summary"
            className="block text-xs font-mono font-medium uppercase text-slate-400"
          >
            Summary Overview
          </label>
          <textarea
            id="summary"
            rows={3}
            {...register("summary")}
            placeholder="Brief high-level overview of the incident..."
            className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
              errors.summary
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.summary && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.summary.message}
            </p>
          )}
        </div>

        {/* Official PostMortem URL */}
        <div>
          <label
            htmlFor="officialPostMortemUrl"
            className="block text-xs font-mono font-medium uppercase text-slate-400"
          >
            Official PostMortem URL
          </label>
          <input
            id="officialPostMortemUrl"
            type="url"
            {...register("officialPostMortemUrl")}
            placeholder="https://status.example.com/incidents/123"
            className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
              errors.officialPostMortemUrl
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {errors.officialPostMortemUrl && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.officialPostMortemUrl.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
