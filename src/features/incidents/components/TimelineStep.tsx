/** @format */

"use client";

import {
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import { timelineStageSchema } from "@/features/incidents/schema";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormSectionHeading } from "./form-fields";

const inputClass = (hasError: boolean) =>
  `block w-full rounded-md border bg-[#0d1520] px-4 py-3 text-[14px] leading-5 text-slate-100 placeholder:text-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 motion-reduce:transition-none ${
    hasError
      ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c] focus:ring-[#c6e47c]/25 focus:bg-[#0e1622]"
  }`;

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400";

const fieldErrorClass =
  "mt-1.5 font-mono text-[11px] leading-[1.5] tracking-[0.02em] text-rose-400";

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
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FormSectionHeading
          title="Incident timeline"
          description="Add at least two events in the order they unfolded. The first event starts at minute zero and must be the trigger."
        />
        <button
          type="button"
          onClick={addEvent}
          className="shrink-0 border border-slate-700 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
        >
          + Add event
        </button>
      </div>

      {timelineError ? (
        <p role="alert" className={fieldErrorClass}>
          {timelineError}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <div className="border border-dashed border-slate-700/80 px-5 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
            No events yet
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Add the trigger event to begin.
          </p>
        </div>
      ) : (
        <ol className="space-y-5">
          {fields.map((field, index) => {
            const eventErrors = errors.timeline?.[index];
            const commands = watch(`timeline.${index}.cliCommands`) ?? [];
            const isTrigger = index === 0;

            return (
              <li key={field.id}>
                <fieldset className="border border-slate-800/80 bg-[#0c151c] px-4 py-5 sm:px-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <legend className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
                        EVENT {index + 1}
                      </span>
                      {isTrigger ? (
                        <span className="border border-[#c6e47c]/40 bg-[#c6e47c]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#d5e8a5]">
                          Trigger · T+0
                        </span>
                      ) : null}
                    </legend>

                    {!isTrigger ? (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Remove event ${index + 1}`}
                        className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-500 transition-colors hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`timeline-${index}-timestamp`}
                        className={labelClass}
                      >
                        Minutes after start
                      </label>
                      <input
                        id={`timeline-${index}-timestamp`}
                        type="number"
                        min={0}
                        readOnly={isTrigger}
                        {...register(
                          `timeline.${index}.timestampOffsetMinutes` as const,
                          { valueAsNumber: true },
                        )}
                        className={`${inputClass(
                          Boolean(eventErrors?.timestampOffsetMinutes),
                        )} ${isTrigger ? "text-slate-500" : ""}`}
                      />
                      {eventErrors?.timestampOffsetMinutes ? (
                        <p className={fieldErrorClass}>
                          {eventErrors.timestampOffsetMinutes.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor={`timeline-${index}-stage`}
                        className={labelClass}
                      >
                        Stage
                      </label>
                      {isTrigger ? (
                        <>
                          <input
                            type="hidden"
                            {...register(`timeline.${index}.stage` as const)}
                          />
                          <p
                            id={`timeline-${index}-stage`}
                            className="w-full rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[12px] uppercase leading-[1.4] tracking-[0.08em] text-[#c6e47c]"
                          >
                            TRIGGER
                          </p>
                        </>
                      ) : (
                        <select
                          id={`timeline-${index}-stage`}
                          {...register(
                            `timeline.${index}.stage` as const,
                          )}
                          className={inputClass(
                            Boolean(eventErrors?.stage),
                          )}
                        >
                          {timelineStageSchema.options.map((stage) => (
                            <option
                              key={stage}
                              value={stage}
                              className="bg-[#0b121a] text-slate-100"
                            >
                              {stage.replaceAll("_", " ").toLowerCase()}
                            </option>
                          ))}
                        </select>
                      )}
                      {eventErrors?.stage ? (
                        <p className={fieldErrorClass}>
                          {eventErrors.stage.message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`timeline-${index}-title`}
                      className={labelClass}
                    >
                      Event title
                    </label>
                    <input
                      id={`timeline-${index}-title`}
                      type="text"
                      {...register(`timeline.${index}.title` as const)}
                      placeholder="e.g. Database connection errors begin"
                      className={inputClass(Boolean(eventErrors?.title))}
                    />
                    {eventErrors?.title ? (
                      <p className={fieldErrorClass}>
                        {eventErrors.title.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`timeline-${index}-description`}
                      className={labelClass}
                    >
                      Description
                    </label>
                    <textarea
                      id={`timeline-${index}-description`}
                      rows={3}
                      {...register(
                        `timeline.${index}.description` as const,
                      )}
                      placeholder="Describe what happened during this event."
                      className={`${inputClass(
                        Boolean(eventErrors?.description),
                      )} h-auto py-2.5 leading-5`}
                    />
                    {eventErrors?.description ? (
                      <p className={fieldErrorClass}>
                        {eventErrors.description.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`timeline-${index}-component`}
                      className={labelClass}
                    >
                      Affected component
                    </label>
                    <input
                      id={`timeline-${index}-component`}
                      type="text"
                      {...register(
                        `timeline.${index}.affectedComponent` as const,
                      )}
                      placeholder="e.g. API Gateway"
                      className={inputClass(
                        Boolean(eventErrors?.affectedComponent),
                      )}
                    />
                    {eventErrors?.affectedComponent ? (
                      <p className={fieldErrorClass}>
                        {eventErrors.affectedComponent.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`timeline-${index}-commands`}
                      className={labelClass}
                    >
                      CLI commands{" "}
                      <span className="normal-case text-slate-600">
                        (optional)
                      </span>
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
                      className="block h-auto w-full resize-y rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[13px] leading-[1.6] text-slate-100 placeholder:text-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:border-[#c6e47c] focus:outline-none focus:ring-2 focus:ring-[#c6e47c]/25 motion-reduce:transition-none"
                    />
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
