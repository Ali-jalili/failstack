/** @format */

"use client";

import { IncidentFormValues } from "@/lib/validation/incident-form";
import { timelineStageSchema } from "@/lib/validation/incident";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelClassName =
  "block text-xs font-mono font-medium uppercase text-slate-400";

export default function TimelineStep() {
  const {
    control,
    getValues,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeline",
  });
  const timelineError =
    errors.timeline?.message ?? errors.timeline?.root?.message;

  const addEvent = () => {
    const timeline = getValues("timeline");
    const lastOffset = timeline.at(-1)?.timestampOffsetMinutes ?? 0;

    append({
      id: crypto.randomUUID(),
      timestampOffsetMinutes: timeline.length === 0 ? 0 : lastOffset + 5,
      stage: timeline.length === 0 ? "TRIGGER" : "FAILURE",
      title: "",
      description: "",
      affectedComponent: "",
      cliCommands: [],
    });
  };

  return (
    <section className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Incident Timeline
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Add at least two events in the order they unfolded. The first event
            starts at minute zero and must be the trigger.
          </p>
        </div>
        <button
          type="button"
          onClick={addEvent}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {timelineError && (
        <p role="alert" className="text-xs text-rose-400">
          {timelineError}
        </p>
      )}

      {fields.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
          No timeline events yet. Add the trigger event to begin.
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const eventErrors = errors.timeline?.[index];
          const commands = watch(`timeline.${index}.cliCommands`) ?? [];

          return (
            <fieldset
              key={field.id}
              className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <legend className="text-sm font-semibold text-slate-100">
                  Event {index + 1}
                  {index === 0 && (
                    <span className="ml-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono uppercase text-blue-300">
                      Trigger
                    </span>
                  )}
                </legend>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove event ${index + 1}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`timeline-${index}-timestamp`}
                    className={labelClassName}
                  >
                    Minutes After Start
                  </label>
                  <input
                    id={`timeline-${index}-timestamp`}
                    type="number"
                    min={0}
                    readOnly={index === 0}
                    {...register(
                      `timeline.${index}.timestampOffsetMinutes` as const,
                      { valueAsNumber: true },
                    )}
                    className={`${inputClassName} ${
                      eventErrors?.timestampOffsetMinutes
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                  />
                  {eventErrors?.timestampOffsetMinutes && (
                    <p className="mt-1 text-xs text-rose-400">
                      {eventErrors.timestampOffsetMinutes.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`timeline-${index}-stage`}
                    className={labelClassName}
                  >
                    Timeline Stage
                  </label>
                  {index === 0 ? (
                    <>
                      <input
                        type="hidden"
                        {...register(`timeline.${index}.stage` as const)}
                      />
                      <p
                        id={`timeline-${index}-stage`}
                        className={`${inputClassName} text-slate-400`}
                      >
                        TRIGGER
                      </p>
                    </>
                  ) : (
                    <select
                      id={`timeline-${index}-stage`}
                      {...register(`timeline.${index}.stage` as const)}
                      className={`${inputClassName} ${
                        eventErrors?.stage
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                    >
                      {timelineStageSchema.options.map((stage) => (
                        <option
                          key={stage}
                          value={stage}
                          className="bg-slate-900 text-slate-100"
                        >
                          {stage.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  )}
                  {eventErrors?.stage && (
                    <p className="mt-1 text-xs text-rose-400">
                      {eventErrors.stage.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor={`timeline-${index}-title`}
                  className={labelClassName}
                >
                  Event Title
                </label>
                <input
                  id={`timeline-${index}-title`}
                  type="text"
                  {...register(`timeline.${index}.title` as const)}
                  placeholder="e.g. Database connection errors begin"
                  className={`${inputClassName} ${
                    eventErrors?.title
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                      : ""
                  }`}
                />
                {eventErrors?.title && (
                  <p className="mt-1 text-xs text-rose-400">
                    {eventErrors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`timeline-${index}-description`}
                  className={labelClassName}
                >
                  Description
                </label>
                <textarea
                  id={`timeline-${index}-description`}
                  rows={3}
                  {...register(`timeline.${index}.description` as const)}
                  placeholder="Describe what happened during this event."
                  className={`${inputClassName} resize-y ${
                    eventErrors?.description
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                      : ""
                  }`}
                />
                {eventErrors?.description && (
                  <p className="mt-1 text-xs text-rose-400">
                    {eventErrors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`timeline-${index}-component`}
                  className={labelClassName}
                >
                  Affected Component
                </label>
                <input
                  id={`timeline-${index}-component`}
                  type="text"
                  {...register(`timeline.${index}.affectedComponent` as const)}
                  placeholder="e.g. API Gateway"
                  className={`${inputClassName} ${
                    eventErrors?.affectedComponent
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                      : ""
                  }`}
                />
                {eventErrors?.affectedComponent && (
                  <p className="mt-1 text-xs text-rose-400">
                    {eventErrors.affectedComponent.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`timeline-${index}-commands`}
                  className={labelClassName}
                >
                  CLI Commands <span className="normal-case">(optional)</span>
                </label>
                <textarea
                  id={`timeline-${index}-commands`}
                  rows={2}
                  value={commands.join("\n")}
                  onChange={(event) => {
                    setValue(
                      `timeline.${index}.cliCommands`,
                      event.target.value
                        .split("\n")
                        .map((command) => command.trim())
                        .filter(Boolean),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                  placeholder={"One command per line, e.g.\nkubectl get pods"}
                  className={`${inputClassName} resize-y font-mono`}
                />
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
