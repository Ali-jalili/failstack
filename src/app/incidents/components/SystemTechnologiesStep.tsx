/** @format */

"use client";

import { IncidentFormValues } from "@/lib/validation/incident-form";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

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
      list.filter((i: string) => i !== item),
      { shouldValidate: true },
    );
  };

  return (
    <div className="space-y-6">
      {/* System Name */}
      <div>
        <label
          htmlFor="system"
          className="block text-xs font-mono font-medium uppercase text-slate-400"
        >
          System
        </label>
        <input
          id="system"
          type="text"
          {...register("system")}
          placeholder="e.g. Payment Service"
          className={`mt-1.5 block w-full rounded-lg border bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:outline-none focus:ring-1 ${
            errors.system
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
              : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
          }`}
        />
        {errors.system && (
          <p className="mt-1 text-xs text-rose-400">{errors.system.message}</p>
        )}
      </div>

      {/* Technologies */}
      <div>
        <label
          htmlFor="technologies"
          className="block text-xs font-mono font-medium uppercase text-slate-400"
        >
          Technologies
        </label>

        <div className="mt-1.5 flex gap-2">
          <input
            id="technologies"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="e.g. PostgreSQL, Redis, Kafka"
            className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:bg-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addItem}
            className="shrink-0 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            Add
          </button>
        </div>

        {list.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {list.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-mono text-slate-200"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="text-slate-400 transition hover:text-rose-400"
                  aria-label={`Remove ${item}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {errors.technologies && (
          <p className="mt-1 text-xs text-rose-400">
            {errors.technologies.message}
          </p>
        )}
      </div>
    </div>
  );
}
