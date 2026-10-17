/** @format */

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

type FieldError = string | { message?: string; type?: string };

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const fieldErrorClass = "mt-1.5 text-[11px] text-rose-400";

function inputClass(hasError: boolean, withToggle = false) {
  return `block h-11 w-full border bg-[#0b121a] px-3.5 ${
    withToggle ? "pr-11" : ""
  } text-[13px] text-slate-100 placeholder-slate-600 transition-colors focus:outline-none focus:ring-1 ${
    hasError
      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c]/70 focus:ring-[#c6e47c]/40"
  }`;
}

const toggleClass =
  "absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]";

/**
 * Standard text input with label, error announcement, and shared focus
 * behavior. Used by the name and email fields on both auth forms.
 */
export function TextField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  error,
  field,
  onClearError,
}: {
  id: string;
  label: string;
  type?: "text" | "email";
  autoComplete?: string;
  placeholder?: string;
  error?: FieldError;
  field: UseFormRegisterReturn;
  onClearError?: () => void;
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
          onChange={(event) => {
            field.onChange?.(event);
            onClearError?.();
          }}
          className={inputClass(Boolean(error))}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={fieldErrorClass}
        >
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}

function VisibilityToggle({
  label,
  visible,
  onToggle,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={visible}
      onClick={onToggle}
      className={toggleClass}
    >
      {visible ? (
        <EyeOff aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Eye aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}

/**
 * Password input with a visibility toggle. The toggle state is local to the
 * field, which removes the need for per-field useState in parent forms.
 */
export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder = "••••••••",
  error,
  field,
  onClearError,
}: {
  id: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  error?: FieldError;
  field: UseFormRegisterReturn;
  onClearError?: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          onChange={(event) => {
            field.onChange?.(event);
            onClearError?.();
          }}
          className={inputClass(Boolean(error), true)}
        />
        <VisibilityToggle
          label={label.toLowerCase()}
          visible={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={fieldErrorClass}
        >
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}

/**
 * Confirm-password field: same as a password field but with a
 * distinguishable accessible toggle label.
 */
export function ConfirmPasswordField({
  id,
  label,
  error,
  field,
  onClearError,
}: {
  id: string;
  label: string;
  error?: FieldError;
  field: UseFormRegisterReturn;
  onClearError?: () => void;
}) {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...field}
          onChange={(event) => {
            field.onChange?.(event);
            onClearError?.();
          }}
          className={inputClass(Boolean(error), true)}
        />
        <VisibilityToggle
          label={label.toLowerCase()}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={fieldErrorClass}
        >
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}
