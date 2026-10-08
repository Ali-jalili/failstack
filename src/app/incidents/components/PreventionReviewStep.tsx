/** @format */

"use client";

import { IncidentFormValues } from "@/lib/validation/incident-form";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelClassName =
  "block text-xs font-mono font-medium uppercase text-slate-400";

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
    <section className="w-full max-w-2xl mx-auto space-y-8">
      <section className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Prevention Actions
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Describe concrete changes that will reduce the chance of this
              incident happening again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => append({ title: "", description: "" })}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Action
          </button>
        </div>

        {preventionActionsError && (
          <p role="alert" className="text-xs text-rose-400">
            {preventionActionsError}
          </p>
        )}

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
            Add at least one action to explain how the team will prevent a
            recurrence.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const actionErrors = errors.preventionActions?.[index];

              return (
                <fieldset
                  key={field.id}
                  className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5"
                >
                  <legend className="sr-only">
                    Prevention action {index + 1}
                  </legend>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">
                      Action {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove prevention action ${index + 1}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor={`prevention-action-${index}-title`}
                      className={labelClassName}
                    >
                      Action
                    </label>
                    <input
                      id={`prevention-action-${index}-title`}
                      type="text"
                      {...register(`preventionActions.${index}.title` as const)}
                      placeholder="e.g. Add connection pool saturation alerts"
                      className={`${inputClassName} ${
                        actionErrors?.title
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                    />
                    {actionErrors?.title && (
                      <p className="mt-1 text-xs text-rose-400">
                        {actionErrors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`prevention-action-${index}-description`}
                      className={labelClassName}
                    >
                      Details{" "}
                      <span className="normal-case">(optional)</span>
                    </label>
                    <textarea
                      id={`prevention-action-${index}-description`}
                      rows={3}
                      {...register(
                        `preventionActions.${index}.description` as const,
                      )}
                      placeholder="Add an owner, implementation details, or how success will be measured."
                      className={`${inputClassName} resize-y ${
                        actionErrors?.description
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                    />
                    {actionErrors?.description && (
                      <p className="mt-1 text-xs text-rose-400">
                        {actionErrors.description.message}
                      </p>
                    )}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-800 pt-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Review Incident
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Check the incident details and prevention plan before submitting.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">
                {reviewValue(values.title)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {reviewValue(values.companyName)} ·{" "}
                {reviewValue(values.system)}
              </p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-mono uppercase text-slate-300">
              {values.severity}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <div>
              <dt className={labelClassName}>Failure Pattern</dt>
              <dd className="mt-1 text-sm text-slate-200">
                {values.pattern.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className={labelClassName}>Duration</dt>
              <dd className="mt-1 text-sm text-slate-200">
                {values.durationMinutes > 0
                  ? `${values.durationMinutes} minutes`
                  : "Not provided"}
              </dd>
            </div>
            <div>
              <dt className={labelClassName}>Occurred At</dt>
              <dd className="mt-1 text-sm text-slate-200">
                {reviewValue(values.occurredAt)}
              </dd>
            </div>
            <div>
              <dt className={labelClassName}>Technologies</dt>
              <dd className="mt-1 text-sm text-slate-200">
                {values.technologies.length > 0
                  ? values.technologies.join(", ")
                  : "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className={labelClassName}>Incident Summary</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                {reviewValue(values.summary)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Timeline & Root Cause
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {values.timeline.length} timeline{" "}
              {values.timeline.length === 1 ? "event" : "events"} ·{" "}
              {values.rootCauseTree.length} RCA{" "}
              {values.rootCauseTree.length === 1 ? "node" : "nodes"}
            </p>
            {values.rootCauseTree
              .filter((node) => node.parentId === null)
              .map((node) => (
                <p
                  key={node.id}
                  className="mt-2 text-sm text-slate-200"
                >
                  Root cause: {reviewValue(node.title)}
                </p>
              ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">
              Architecture Change
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {values.architectureDiff.isFact
                ? "Documented facts"
                : "Reconstructed"}
            </p>
            <p className="mt-2 text-sm text-slate-200">
              {values.architectureDiff.beforeFix
                ? `Before: ${values.architectureDiff.beforeFix}`
                : "Before-fix details not provided"}
            </p>
            <p className="mt-1 text-sm text-slate-200">
              {values.architectureDiff.afterFix
                ? `After: ${values.architectureDiff.afterFix}`
                : "After-fix details not provided"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            Prevention Plan
          </h3>
          {values.preventionActions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              No prevention actions added yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-3">
              {values.preventionActions.map((action, index) => (
                <li
                  key={`${index}-${action.title}`}
                  className="border-l-2 border-blue-500/50 pl-3"
                >
                  <p className="text-sm font-medium text-slate-200">
                    {reviewValue(action.title)}
                  </p>
                  {action.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">
                      {action.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </section>
  );
}
