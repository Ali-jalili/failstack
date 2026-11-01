/** @format */

"use client";

import { useState } from "react";
import { type IncidentFormValues } from "@/features/incidents/form-schema";
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

function eventHasErrors(
  error: object | undefined,
) {
  return Boolean(error && Object.keys(error).length > 0);
}

export default function TimelineStep() {
  const {
    control,
    getValues,
    register,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeline",
  });
  const events = watch("timeline") ?? [];
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedIndex = events.findIndex(
    (event) => event.id === selectedEventId,
  );
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const activeEvent = events[activeIndex];
  const timelineError =
    errors.timeline?.message ?? errors.timeline?.root?.message;
  const firstInvalidIndex = events.findIndex((_, index) =>
    eventHasErrors(errors.timeline?.[index]),
  );

  const addEvent = () => {
    clearErrors("timeline");
    const timeline = getValues("timeline");
    const lastOffset = timeline.at(-1)?.timestampOffsetMinutes ?? 0;
    const id = crypto.randomUUID();

    append({
      id,
      timestampOffsetMinutes: timeline.length === 0 ? 0 : lastOffset + 5,
      stage: timeline.length === 0 ? "TRIGGER" : "FAILURE",
      title: "",
      description: "",
      affectedComponent: "",
      cliCommands: [],
    });
    setSelectedEventId(id);
  };

  const removeEvent = (index: number) => {
    if (index === 0) return;
    const remaining = events.filter((_, eventIndex) => eventIndex !== index);
    remove(index);
    if (events[index]?.id === selectedEventId) {
      setSelectedEventId(remaining[Math.min(index, remaining.length - 1)]?.id ?? null);
    }
  };

  return (
    <section className="space-y-5">
      <FormSectionHeading
        title="Incident timeline"
        description="Add events in the order they unfolded. The first event starts at minute zero and must be the trigger."
      />

      {timelineError ? (
        <p role="alert" className={fieldErrorClass}>
          {timelineError}
        </p>
      ) : null}
      {firstInvalidIndex >= 0 ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2"
        >
          <p className={fieldErrorClass}>
            Event {firstInvalidIndex + 1} has fields that need attention.
          </p>
          <button
            type="button"
            onClick={() => setSelectedEventId(events[firstInvalidIndex].id)}
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-rose-300 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Go to event {firstInvalidIndex + 1}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
        <aside
          aria-label="Event sequence"
          className="border border-slate-800/80 bg-[#0b121a]/70 p-3 sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-200">
                Event sequence
              </h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {events.length} {events.length === 1 ? "event" : "events"}
              </p>
            </div>
            <button
              type="button"
              onClick={addEvent}
              className="shrink-0 rounded-md border border-[#c6e47c]/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[#d5e8a5] transition-colors hover:bg-[#c6e47c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
            >
              + Add event
            </button>
          </div>

          {events.length === 0 ? (
            <p className="mt-4 border border-dashed border-slate-700 px-3 py-5 text-center text-[12px] text-slate-400">
              Add the trigger event to begin.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {fields.map((field, index) => {
                const event = events[index];
                if (!event) return null;
                const isSelected = event.id === events[activeIndex]?.id;
                const hasError = eventHasErrors(errors.timeline?.[index]);

                return (
                  <li key={field.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? "true" : undefined}
                      aria-label={`Event ${index + 1}: ${event.title || "Untitled"}, ${event.stage.replaceAll("_", " ").toLowerCase()}, ${event.timestampOffsetMinutes === 0 ? "T+0" : `T+${event.timestampOffsetMinutes} minutes`}${hasError ? ", has validation errors" : ""}`}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] ${
                        isSelected
                          ? "border-[#c6e47c]/70 bg-[#c6e47c]/[0.08]"
                          : "border-slate-800 bg-[#0d1520]/70 hover:border-slate-700"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate text-[12px] font-medium text-slate-100">
                            {event.title.trim() || "Untitled event"}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[9px] text-slate-400">
                          T+{event.timestampOffsetMinutes} min
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2 pl-7">
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-slate-500">
                          {event.stage.replaceAll("_", " ").toLowerCase()}
                        </span>
                        {hasError ? (
                          <span className="font-mono text-[9px] text-rose-400">
                            Needs attention
                          </span>
                        ) : null}
                      </span>
                      {event.description.trim() ? (
                        <span className="mt-1 block line-clamp-2 pl-7 text-[11px] leading-4 text-slate-400">
                          {event.description}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>

        <div className="min-w-0 border border-slate-800/80 bg-[#0c151c] p-4 sm:p-5">
          {activeEvent ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <h3 className="text-[13px] font-semibold text-slate-100">
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#c6e47c]">
                    Event {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                  {activeEvent.title.trim() || "Untitled event"}
                </h3>
                {activeIndex === 0 ? (
                  <span className="rounded border border-[#c6e47c]/30 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-[#d5e8a5]">
                    Trigger · T+0
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeEvent(activeIndex)}
                    className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-500 transition-colors hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                  >
                    Remove event
                  </button>
                )}
              </div>

              {(() => {
                const index = activeIndex;
                const eventErrors = errors.timeline?.[index];
                const commands = watch(`timeline.${index}.cliCommands`) ?? [];
                const isTrigger = index === 0;

                return (
                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`timeline-${index}-timestamp`} className={labelClass}>
                          Minutes after start
                        </label>
                        <input
                          id={`timeline-${index}-timestamp`}
                          type="number"
                          min={0}
                          readOnly={isTrigger}
                          aria-invalid={Boolean(eventErrors?.timestampOffsetMinutes)}
                          {...register(`timeline.${index}.timestampOffsetMinutes` as const, {
                            valueAsNumber: true,
                          })}
                          className={`${inputClass(Boolean(eventErrors?.timestampOffsetMinutes))} ${isTrigger ? "text-slate-500" : ""}`}
                        />
                        {eventErrors?.timestampOffsetMinutes ? (
                          <p role="alert" className={fieldErrorClass}>
                            {eventErrors.timestampOffsetMinutes.message}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label htmlFor={`timeline-${index}-stage`} className={labelClass}>
                          Stage
                        </label>
                        {isTrigger ? (
                          <>
                            <input type="hidden" {...register(`timeline.${index}.stage` as const)} />
                            <p id={`timeline-${index}-stage`} className="w-full rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[12px] uppercase leading-[1.4] tracking-[0.08em] text-[#c6e47c]">
                              TRIGGER
                            </p>
                          </>
                        ) : (
                          <select
                            id={`timeline-${index}-stage`}
                            aria-invalid={Boolean(eventErrors?.stage)}
                            {...register(`timeline.${index}.stage` as const)}
                            className={inputClass(Boolean(eventErrors?.stage))}
                          >
                            {timelineStageSchema.options.map((stage) => (
                              <option key={stage} value={stage} className="bg-[#0b121a] text-slate-100">
                                {stage.replaceAll("_", " ").toLowerCase()}
                              </option>
                            ))}
                          </select>
                        )}
                        {eventErrors?.stage ? (
                          <p role="alert" className={fieldErrorClass}>
                            {eventErrors.stage.message}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor={`timeline-${index}-title`} className={labelClass}>
                        Event title
                      </label>
                      <input
                        id={`timeline-${index}-title`}
                        type="text"
                        aria-invalid={Boolean(eventErrors?.title)}
                        {...register(`timeline.${index}.title` as const, {
                          onChange: () => clearErrors(`timeline.${index}.title` as const),
                        })}
                        placeholder="e.g. Database connection errors begin"
                        className={inputClass(Boolean(eventErrors?.title))}
                      />
                      {eventErrors?.title ? (
                        <p role="alert" className={fieldErrorClass}>
                          {eventErrors.title.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <label htmlFor={`timeline-${index}-description`} className={labelClass}>
                        Description
                      </label>
                      <textarea
                        id={`timeline-${index}-description`}
                        rows={3}
                        aria-invalid={Boolean(eventErrors?.description)}
                        {...register(`timeline.${index}.description` as const)}
                        placeholder="Describe what happened during this event."
                        className={`${inputClass(Boolean(eventErrors?.description))} h-auto py-2.5 leading-5`}
                      />
                      {eventErrors?.description ? (
                        <p role="alert" className={fieldErrorClass}>
                          {eventErrors.description.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <label htmlFor={`timeline-${index}-component`} className={labelClass}>
                        Affected component
                      </label>
                      <input
                        id={`timeline-${index}-component`}
                        type="text"
                        aria-invalid={Boolean(eventErrors?.affectedComponent)}
                        {...register(`timeline.${index}.affectedComponent` as const)}
                        placeholder="e.g. API Gateway"
                        className={inputClass(Boolean(eventErrors?.affectedComponent))}
                      />
                      {eventErrors?.affectedComponent ? (
                        <p role="alert" className={fieldErrorClass}>
                          {eventErrors.affectedComponent.message}
                        </p>
                      ) : null}
                    </div>

                    <details className="mt-4 rounded-md border border-slate-800 bg-[#0d1520]/70 px-3 py-2.5">
                      <summary className="cursor-pointer text-[12px] text-slate-300 marker:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]">
                        CLI commands <span className="text-slate-500">(optional)</span>
                      </summary>
                      <label htmlFor={`timeline-${index}-commands`} className={`${labelClass} mt-3`}>
                        One command per line
                      </label>
                      <textarea
                        id={`timeline-${index}-commands`}
                        rows={2}
                        value={commands.join("\n")}
                        onChange={(event) =>
                          setValue(
                            `timeline.${index}.cliCommands`,
                            event.target.value
                              .split("\n")
                              .map((command) => command.trim())
                              .filter(Boolean),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        placeholder={"e.g.\nkubectl get pods"}
                        className="mt-1.5 block h-auto w-full resize-y rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[13px] leading-[1.6] text-slate-100 placeholder:text-slate-600 focus:border-[#c6e47c] focus:outline-none focus:ring-2 focus:ring-[#c6e47c]/25"
                      />
                    </details>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex min-h-48 items-center justify-center text-center">
              <p className="text-[12px] text-slate-400">
                Select an event to edit it, or add the trigger event to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
