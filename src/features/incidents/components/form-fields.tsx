/** @format */

"use client";

import { useFormContext } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const inputBase =
  "block h-11 w-full border bg-[#0d1520] px-3.5 text-[13px] text-slate-100 placeholder-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 motion-reduce:transition-none";

const inputOk =
  "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c] focus:ring-[#c6e47c]/25";

const inputErr =
  "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30";

function useClearError(name: string) {
  const { clearErrors } = useFormContext();
  return () => clearErrors(name);
}

function FieldError({
  id,
  error,
}: {
  id: string;
  error?: string;
}) {
  if (!error) return null;
  return (
    <p
      id={`${id}-error`}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-[1.5] text-rose-400"
    >
      <span aria-hidden="true" className="mt-px font-mono text-[10px] text-rose-500">
        !
      </span>
      <span>{error}</span>
    </p>
  );
}

function useFieldClasses(error?: string) {
  return `${inputBase} ${error ? inputErr : inputOk}`;
}

function useLabelClass(error?: string) {
  return `${labelClass} ${error ? "!text-rose-400" : ""}`;
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
  const clearError = useClearError(field.name);
  const classes = useFieldClasses(error);
  const labelClasses = useLabelClass(error);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
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
          onChange={(event) => {
            field.onChange?.(event);
            clearError();
          }}
          className={classes}
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
  const clearError = useClearError(field.name);
  const classes = useFieldClasses(error);
  const labelClasses = useLabelClass(error);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
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
          onChange={(event) => {
            field.onChange?.(event);
            clearError();
          }}
          className={`${classes} [appearance:textfield]`}
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
  const clearError = useClearError(field.name);
  const classes = useFieldClasses(error);
  const labelClasses = useLabelClass(error);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="mt-1.5">
        <input
          id={id}
          type="datetime-local"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          onChange={(event) => {
            field.onChange?.(event);
            clearError();
          }}
          className={`${classes} [color-scheme:dark]`}
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
  const clearError = useClearError(field.name);
  const classes = useFieldClasses(error);
  const labelClasses = useLabelClass(error);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
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
          onChange={(event) => {
            field.onChange?.(event);
            clearError();
          }}
          className={`${classes} h-auto resize-y py-2.5 leading-5`}
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
  const clearError = useClearError(field.name);
  const classes = useFieldClasses(error);
  const labelClasses = useLabelClass(error);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          onChange={(event) => {
            field.onChange?.(event);
            clearError();
          }}
          className={`${classes} cursor-pointer appearance-none pr-9`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#0d1520] text-slate-100"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-500"
        >
          ▾
        </span>
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FormHint({ children }: { children: string }) {
  return (
    <p className="mt-1.5 font-mono text-[10px] leading-[1.5] tracking-[0.04em] text-slate-500">
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
    <div>
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
