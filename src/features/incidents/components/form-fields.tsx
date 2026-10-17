/** @format */

"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const inputClass = (hasError: boolean) =>
  `block h-11 w-full border bg-[#0b121a] px-3.5 text-[13px] text-slate-100 placeholder-slate-600 transition-colors focus:outline-none focus:ring-1 ${
    hasError
      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c]/70 focus:ring-[#c6e47c]/40"
  }`;

const errorClass =
  "mt-1.5 text-[11px] text-rose-400 font-mono tracking-[0.02em]";

function FieldError({
  id,
  error,
}: {
  id: string;
  error?: string;
}) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} role="alert" className={errorClass}>
      {error}
    </p>
  );
}

export function FormTextField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  error,
  field,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "url";
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          className={inputClass(Boolean(error))}
        />
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormNumberField({
  id,
  label,
  min,
  error,
  field,
}: {
  id: string;
  label: string;
  min?: number;
  error?: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={id}
          type="number"
          min={min}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          className={inputClass(Boolean(error))}
        />
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormDateTimeField({
  id,
  label,
  error,
  field,
}: {
  id: string;
  label: string;
  error?: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={id}
          type="datetime-local"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          className={`${inputClass(Boolean(error))} [color-scheme:dark]`}
        />
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormTextAreaField({
  id,
  label,
  rows = 3,
  placeholder,
  error,
  field,
}: {
  id: string;
  label: string;
  rows?: number;
  placeholder?: string;
  error?: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">
        <textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          className={`${inputClass(Boolean(error))} resize-y py-2.5 leading-5`}
        />
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormSelectField<T extends string>({
  id,
  label,
  options,
  error,
  field,
}: {
  id: string;
  label: string;
  options: readonly { value: T; label: string }[];
  error?: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          className={inputClass(Boolean(error))}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#0b121a] text-slate-100"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormHint({ children }: { children: string }) {
  return (
    <p className="mt-1 font-mono text-[10px] leading-[1.5] tracking-[0.04em] text-slate-500">
      {children}
    </p>
  );
}

export function FormSectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-slate-800/80 pb-4">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-100">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-[12px] leading-[1.6] text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
