/** @format */

"use client";

import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { formatDate, severityMeta } from "./visualization-shared";
import type { ReviewIncident } from "@/features/review/server/queries";

/**
 * The dedicated review queue: every pending incident is a ledger row linking
 * to its own addressable detail route (`/review/incidents/[incidentId]`).
 *
 * The split-view selection state, the mobile queue dialog, and the inline
 * detail pane were removed when review moved to the dedicated full-page
 * route; the decision flow now lives in `incident-review-detail.tsx`.
 */
export default function IncidentReviewQueue({
  incidents,
}: {
  incidents: ReviewIncident[];
}) {
  if (incidents.length === 0) {
    return (
      <section aria-label="Incidents awaiting review">
        <div className="border-y border-dashed border-slate-700/80 py-12 text-center sm:py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#c6e47c]">
            Queue clear
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
            No reports awaiting review
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            New submissions will appear here in arrival order.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Incidents awaiting review">
      <nav aria-label="Pending incident reports">
        <div className="flex shrink-0 items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
              Intake ledger
            </p>
            <h2 className="mt-1 text-lg font-normal text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
              Pending reports
            </h2>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#c6e47c]">
            {String(incidents.length).padStart(2, "0")}
          </span>
        </div>
        <ol className="divide-y divide-slate-800/70 border-b border-slate-800">
          {incidents.map((incident, index) => (
            <QueueRow
              key={incident.id}
              incident={incident}
              position={index + 1}
            />
          ))}
        </ol>
      </nav>
      <p className="mt-3 text-[10px] leading-5 text-slate-600">
        Oldest submissions appear first. Opening a report takes you to its full
        review page with previous/next navigation.
      </p>
    </section>
  );
}

function QueueRow({
  incident,
  position,
}: {
  incident: ReviewIncident;
  position: number;
}) {
  const sev = severityMeta[incident.severity];
  return (
    <li>
      <Link
        href={`/review/incidents/${incident.id}`}
        className="group relative block w-full px-4 py-4 pr-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] sm:px-5 motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-0 top-3 w-px bg-transparent transition-colors group-hover:bg-[#c6e47c]/60 motion-reduce:transition-none"
        />
        <span className="flex items-center justify-between gap-3">
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.1em] ${sev?.text ?? "text-slate-400"}`}
          >
            {sev?.label ?? incident.severity}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-slate-600">
            {String(position).padStart(2, "0")}
          </span>
        </span>
        <span className="mt-2 block break-words text-sm leading-5 text-slate-300 transition-colors group-hover:text-slate-100 motion-reduce:transition-none">
          {incident.title}
        </span>
        <span className="mt-1 block truncate text-[11px] text-slate-500">
          {incident.company_name} / {incident.system}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[10px] text-slate-600">
            Submitted {formatDate(incident.created_at)} UTC
          </span>
          {(incident.author_name || incident.author_email) && (
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <UserRound
                aria-hidden="true"
                className="h-3 w-3 text-slate-600"
              />
              {incident.author_name ?? incident.author_email}
            </span>
          )}
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-[#c6e47c] motion-reduce:transition-none"
          />
        </span>
      </Link>
    </li>
  );
}
