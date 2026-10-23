"use client";

import { Clock, Cpu, Timer, Waypoints } from "lucide-react";
import type { ReviewIncident } from "@/features/review/server/queries";
import { formatDate, patternLabel } from "@/app/review/incidents/components/visualization-shared";

/* ---------- Facts bar ---------- */

export function IncidentFactsBar({ incident }: { incident: ReviewIncident }) {
  const facts = [
    {
      icon: Clock,
      label: "Incident time",
      value: `${formatDate(incident.occurred_at)} UTC`,
    },
    {
      icon: Timer,
      label: "Duration",
      value: `${incident.duration_minutes} minutes`,
    },
    {
      icon: Waypoints,
      label: "Pattern",
      value: patternLabel(incident.pattern),
    },
    {
      icon: Cpu,
      label: "Technologies",
      value: incident.technologies.join(" · ") || "—",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {facts.map((f) => (
        <div
          key={f.label}
          className="rounded-md border border-slate-800 bg-[#0b111b]/60 p-3"
        >
          <div className="flex items-center gap-2">
            <f.icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
              {f.label}
            </dt>
          </div>
          <dd className="mt-1.5 break-words text-xs text-slate-300">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
