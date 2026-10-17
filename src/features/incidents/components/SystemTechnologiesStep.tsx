/** @format */

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import {
  FormSectionHeading,
  FormTextField,
} from "./form-fields";

const tagInputClass =
  "block h-11 w-full border border-slate-800 bg-[#0b121a] px-3.5 text-[13px] text-slate-100 placeholder-slate-600 transition-colors focus:border-[#c6e47c]/70 focus:outline-none focus:ring-1 focus:ring-[#c6e47c]/40";

export default function SystemTechnologiesStep() {
  const [input, setInput] = useState<string>("");

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();

  const list: string[] = watch("technologies") ?? [];

  const addItem = (): void => {
    const trimmed: string = input.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) return;

    setValue("technologies", [...list, trimmed], { shouldValidate: true });
    setInput("");
  };

  const removeItem = (item: string): void => {
    setValue(
      "technologies",
      list.filter((technology) => technology !== item),
      { shouldValidate: true },
    );
  };

  return (
    <section className="space-y-7">
      <FormSectionHeading
        title="System & technologies"
        description="Identify the affected system and the stack it depends on. This ties the timeline to the underlying architecture."
      />

      <div className="space-y-5">
        <FormTextField
          id="system"
          label="System"
          placeholder="e.g. Payment service"
          error={errors.system?.message}
          field={register("system")}
        />

        <div>
          <label
            htmlFor="technologies"
            className="block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400"
          >
            Technologies
          </label>

          <div className="mt-1.5 flex gap-2">
            <input
              id="technologies"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addItem();
                }
              }}
              placeholder="e.g. PostgreSQL, Redis, Kafka — press Enter to add"
              aria-describedby={
                errors.technologies?.message ? "technologies-error" : undefined
              }
              aria-invalid={Boolean(errors.technologies?.message)}
              className={tagInputClass}
            />
            <button
              type="button"
              onClick={addItem}
              className="shrink-0 border border-slate-700 bg-slate-900/40 px-4 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
            >
              Add
            </button>
          </div>

          {list.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {list.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 border border-slate-700/80 bg-slate-900/40 px-3 py-1 font-mono text-[11px] tracking-[0.02em] text-slate-200"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    aria-label={`Remove ${item}`}
                    className="text-slate-500 transition-colors hover:text-rose-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {errors.technologies?.message ? (
            <p
              id="technologies-error"
              role="alert"
              className="mt-1.5 font-mono text-[11px] tracking-[0.02em] text-rose-400"
            >
              {errors.technologies.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
