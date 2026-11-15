"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { IncidentFormValues } from "@/features/incidents/form-schema";
import { FormSectionHeading } from "./FormFields";
export const inputClass = (hasError: boolean) =>
  `block w-full rounded-md border bg-[#0d1520] px-4 py-3 text-[14px] leading-5 text-slate-100 placeholder:text-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 motion-reduce:transition-none ${
    hasError
      ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c] focus:ring-[#c6e47c]/25 focus:bg-[#0e1622]"
  }`;

export const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

export const fieldErrorClass =
  "mt-1 font-mono text-[11px] leading-[1.5] tracking-[0.02em] text-rose-400";

export default function ArchitectureDiffFields() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();

  return (<section className="space-y-5 border-t border-slate-800/80 pt-6">
        <FormSectionHeading
          title="Architecture before / after"
          description="Describe how the system architecture changed to address the incident, and clarify whether the change is documented fact or a reconstruction."
        />

        <div>
          <label htmlFor="architecture-before-fix" className={labelClass}>
            Before the fix
          </label>
          <textarea
            id="architecture-before-fix"
            rows={4}
            {...register("architectureDiff.beforeFix")}
            placeholder="Describe the relevant architecture and how it behaved before the fix."
            className={`${inputClass(Boolean(errors.architectureDiff?.beforeFix))} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.beforeFix ? (
            <p role="alert" className={fieldErrorClass}>
              {errors.architectureDiff.beforeFix.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="architecture-after-fix" className={labelClass}>
            After the fix
          </label>
          <textarea
            id="architecture-after-fix"
            rows={4}
            {...register("architectureDiff.afterFix")}
            placeholder="Describe the changes made and how the system behaves now."
            className={`${inputClass(Boolean(errors.architectureDiff?.afterFix))} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.afterFix ? (
            <p role="alert" className={fieldErrorClass}>
              {errors.architectureDiff.afterFix.message}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-3">
          <legend className={labelClass}>
            Is this change documented as fact?
          </legend>
          <Controller
            control={control}
            name="architectureDiff.isFact"
            render={({ field }) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 border border-slate-800 bg-[#0b121a] px-3.5 py-2.5 text-[13px] text-slate-200 transition has-[:checked]:border-[#c6e47c]/60 has-[:checked]:bg-[#c6e47c]/[0.08]">
                  <input
                    ref={field.ref}
                    type="radio"
                    name={field.name}
                    value="true"
                    checked={field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(true)}
                    className="accent-[#c6e47c]"
                  />
                  Yes, this is documented
                </label>
                <label className="flex cursor-pointer items-center gap-2 border border-slate-800 bg-[#0b121a] px-3.5 py-2.5 text-[13px] text-slate-200 transition has-[:checked]:border-[#c6e47c]/60 has-[:checked]:bg-[#c6e47c]/[0.08]">
                  <input
                    ref={field.ref}
                    type="radio"
                    name={field.name}
                    value="false"
                    checked={!field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(false)}
                    className="accent-[#c6e47c]"
                  />
                  No, this is reconstructed
                </label>
              </div>
            )}
          />
        </fieldset>

        {!watch("architectureDiff.isFact") ? (
          <div>
            <label htmlFor="architecture-notes" className={labelClass}>
              Reconstruction notes
            </label>
            <textarea
              id="architecture-notes"
              rows={3}
              {...register("architectureDiff.notes")}
              placeholder="Explain what evidence or reasoning supports this reconstruction."
              className={`${inputClass(Boolean(errors.architectureDiff?.notes))} h-auto py-2.5 leading-5`}
            />
            {errors.architectureDiff?.notes ? (
              <p role="alert" className={fieldErrorClass}>
                {errors.architectureDiff.notes.message}
              </p>
            ) : null}
            <p className="mt-1 font-mono text-[10px] leading-[1.5] tracking-[0.04em] text-slate-500">
              Notes are required when the architecture details are
              reconstructed.
            </p>
          </div>
        ) : null}
      </section>
  );
}