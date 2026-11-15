"use client";

import type { ReviewIncident } from "@/features/review/server/queries";

/* ---------- Prevention actions ---------- */

export function PreventionList({
  actions,
}: {
  actions: ReviewIncident["prevention_actions"];
}) {
  if (actions.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No prevention actions were submitted.
      </p>
    );
  }

  return (
    <ol className="mt-5 grid gap-3 sm:grid-cols-2">
      {actions.map((action, i) => (
        <li
          key={i}
          className="rounded-md border border-slate-800 bg-[#0b111b]/70 p-4 transition-colors hover:border-[#c6e47c]/40"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#c6e47c]/25 bg-[#c6e47c]/10 font-mono text-[11px] font-semibold text-[#c6e47c]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h4 className="break-words text-sm font-medium text-slate-100">
                {action.title}
              </h4>
              {action.description && (
                <p className="mt-1.5 break-words text-xs leading-5 text-slate-400">
                  {action.description}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
