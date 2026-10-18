/** @format */

"use client";

import {
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormSectionHeading } from "./form-fields";

const inputClass = (hasError: boolean) =>
  `block w-full rounded-md border bg-[#0d1520] px-4 py-3 text-[14px] leading-5 text-slate-100 placeholder:text-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 motion-reduce:transition-none ${
    hasError
      ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c] focus:ring-[#c6e47c]/25 focus:bg-[#0e1622]"
  }`;

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const fieldErrorClass =
  "mt-1 font-mono text-[11px] leading-[1.5] tracking-[0.02em] text-rose-400";

function reviewValue(value: string | number | undefined) {
  return value === undefined || value === "" ? "Not provided" : value;
}

export default function PreventionReviewStep() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "preventionActions",
  });
  const values = watch();
  const preventionActionsError =
    errors.preventionActions?.message ??
    errors.preventionActions?.root?.message;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FormSectionHeading
          title="Prevention actions"
          description="Describe concrete changes that will reduce the chance of this incident happening again."
        />
        <button
          type="button"
          onClick={() => append({ title: "", description: "" })}
          className="shrink-0 border border-slate-700 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
        >
          + Add action
        </button>
      </div>

      {preventionActionsError ? (
        <p role="alert" className={fieldErrorClass}>
          {preventionActionsError}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <div className="border border-dashed border-slate-700/80 px-5 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
            No actions yet
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Add at least one action to explain how the team will prevent a
            recurrence.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {fields.map((field, index) => {
            const actionErrors = errors.preventionActions?.[index];

            return (
              <li key={field.id}>
                <fieldset className="space-y-4 border border-slate-800/80 bg-[#0c151c] px-4 py-5 sm:px-5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <legend className="text-[13px] font-semibold text-slate-100">
                      Action {index + 1}
                    </legend>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove prevention action ${index + 1}`}
                      className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-500 transition-colors hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={`prevention-action-${index}-title`}
                      className={labelClass}
                    >
                      Action
                    </label>
                    <input
                      id={`prevention-action-${index}-title`}
                      type="text"
                      {...register(
                        `preventionActions.${index}.title` as const,
                      )}
                      placeholder="e.g. Add connection pool saturation alerts"
                      className={inputClass(Boolean(actionErrors?.title))}
                    />
                    {actionErrors?.title ? (
                      <p className={fieldErrorClass}>
                        {actionErrors.title.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor={`prevention-action-${index}-description`}
                      className={labelClass}
                    >
                      Details{" "}
                      <span className="normal-case text-slate-600">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id={`prevention-action-${index}-description`}
                      rows={3}
                      {...register(
                        `preventionActions.${index}.description` as const,
                      )}
                      placeholder="Add an owner, implementation details, or how success will be measured."
                      className={`${inputClass(
                        Boolean(actionErrors?.description),
                      )} h-auto py-2.5 leading-5`}
                    />
                    {actionErrors?.description ? (
                      <p className={fieldErrorClass}>
                        {actionErrors.description.message}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}

      <section className="space-y-5 border-t border-slate-800/80 pt-6">
        <FormSectionHeading
          title="Review incident"
          description="Check the incident details and prevention plan before submitting."
        />

        <div className="border border-slate-800/80 bg-[#0c151c] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-slate-100">
                {reviewValue(values.title)}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                {reviewValue(values.companyName)} ·{" "}
                {reviewValue(values.system)}
              </p>
            </div>
            <span className="border border-slate-700/80 bg-slate-900/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-slate-300">
              {values.severity}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800/80 pt-4 sm:grid-cols-2">
            <div>
              <dt className={labelClass}>Failure pattern</dt>
              <dd className="mt-1 text-[13px] text-slate-200">
                {values.pattern.replaceAll("_", " ").toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className={labelClass}>Duration</dt>
              <dd className="mt-1 text-[13px] text-slate-200">
                {values.durationMinutes > 0
                  ? `${values.durationMinutes} minutes`
                  : "Not provided"}
              </dd>
            </div>
            <div>
              <dt className={labelClass}>Occurred at</dt>
              <dd className="mt-1 text-[13px] text-slate-200">
                {reviewValue(values.occurredAt)}
              </dd>
            </div>
            <div>
              <dt className={labelClass}>Technologies</dt>
              <dd className="mt-1 text-[13px] text-slate-200">
                {values.technologies.length > 0
                  ? values.technologies.join(", ")
                  : "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className={labelClass}>Incident summary</dt>
              <dd className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6] text-slate-200">
                {reviewValue(values.summary)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-slate-800/80 bg-[#0c151c] p-4">
            <h3 className="text-[13px] font-semibold text-slate-100">
              Timeline &amp; root cause
            </h3>
            <p className="mt-2 text-[12px] text-slate-400">
              {values.timeline.length} timeline{" "}
              {values.timeline.length === 1 ? "event" : "events"} ·{" "}
              {values.rootCauseTree.length} RCA{" "}
              {values.rootCauseTree.length === 1 ? "node" : "nodes"}
            </p>
            {values.rootCauseTree
              .filter((node) => node.parentId === null)
              .map((node) => (
                <p key={node.id} className="mt-2 text-[12px] text-slate-300">
                  Root cause: {reviewValue(node.title)}
                </p>
              ))}
          </div>

          <div className="border border-slate-800/80 bg-[#0c151c] p-4">
            <h3 className="text-[13px] font-semibold text-slate-100">
              Architecture change
            </h3>
            <p className="mt-2 text-[12px] text-slate-400">
              {values.architectureDiff.isFact
                ? "Documented facts"
                : "Reconstructed"}
            </p>
            <p className="mt-2 text-[12px] leading-[1.6] text-slate-300">
              {values.architectureDiff.beforeFix
                ? `Before: ${values.architectureDiff.beforeFix}`
                : "Before-fix details not provided"}
            </p>
            <p className="mt-1 text-[12px] leading-[1.6] text-slate-300">
              {values.architectureDiff.afterFix
                ? `After: ${values.architectureDiff.afterFix}`
                : "After-fix details not provided"}
            </p>
          </div>
        </div>

        <div className="border border-slate-800/80 bg-[#0c151c] p-4 sm:p-5">
          <h3 className="text-[13px] font-semibold text-slate-100">
            Prevention plan
          </h3>
          {values.preventionActions.length === 0 ? (
            <p className="mt-2 text-[12px] text-slate-400">
              No prevention actions added yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-3">
              {values.preventionActions.map((action, index) => (
                <li
                  key={`${index}-${action.title}`}
                  className="border-l-2 border-[#c6e47c]/50 pl-3"
                >
                  <p className="text-[13px] font-medium text-slate-200">
                    {reviewValue(action.title)}
                  </p>
                  {action.description ? (
                    <p className="mt-1 whitespace-pre-wrap text-[12px] leading-[1.6] text-slate-400">
                      {action.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </section>
  );
}
