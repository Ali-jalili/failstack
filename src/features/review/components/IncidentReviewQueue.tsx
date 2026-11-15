/** @format */

"use client";

import { Boxes, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReviewIncident } from "@/features/review/server/queries";
import {
  SEVERITIES,
  SEVERITY_RANK,
  severityColor,
  type SeverityKey,
  type ServiceFilter,
  type SortKey,
  relativeTime,
} from "./incident-review-queue-shared";
import {
  SummaryPanel,
  SeverityDistribution,
  SortControl,
  ServiceFilterControl,
  QueueRow,
  ServiceExposure,
} from "./IncidentReviewQueueParts";

/* ---------- types & constants ---------- */

function serviceKey(system: string): string {
  const trimmed = system?.trim();
  return trimmed ? trimmed : "—";
}

export default function IncidentReviewQueue({
  incidents,
}: {
  incidents: ReviewIncident[];
}) {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("default");

  /* --- derived data (all computed from the real queue) --- */

  const serviceList = useMemo(() => {
    const seen = new Map<string, string>();
    for (const inc of incidents) {
      const key = serviceKey(inc.system);
      if (!seen.has(key)) seen.set(key, key === "—" ? "Unknown service" : key);
    }
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [incidents]);

  const serviceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const inc of incidents) {
      const key = serviceKey(inc.system);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [incidents]);

  const maxServiceCount = useMemo(
    () => Math.max(0, ...Array.from(serviceCounts.values())),
    [serviceCounts],
  );

  const severityCounts = useMemo(
    () =>
      SEVERITIES.reduce<Record<SeverityKey, number>>(
        (acc, sev) => {
          acc[sev] = incidents.filter((i) => i.severity === sev).length;
          return acc;
        },
        { CRITICAL: 0, MAJOR: 0, MINOR: 0 },
      ),
    [incidents],
  );

  const criticalMajorCount =
    severityCounts.CRITICAL + severityCounts.MAJOR;

  /* --- filtered & sorted queue --- */

  const filtered = useMemo(() => {
    let list = incidents;
    if (serviceFilter !== "ALL") {
      list = list.filter((i) => serviceKey(i.system) === serviceFilter);
    }
    if (sortKey === "newest") {
      list = [...list].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      );
    } else if (sortKey === "oldest") {
      list = [...list].sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
      );
    }
    // "priority" is the default and is already applied via the server query order
    // (created_at ascending) plus a client-side severity-priority sort.
    if (sortKey === "default" || sortKey === "priority") {
      const ordered = [...list].sort((a, b) => {
        const sa = SEVERITY_RANK[a.severity as SeverityKey] ?? 99;
        const sb = SEVERITY_RANK[b.severity as SeverityKey] ?? 99;
        if (sa !== sb) return sa - sb;
        return Date.parse(a.created_at) - Date.parse(b.created_at);
      });
      return ordered;
    }
    return list;
  }, [incidents, serviceFilter, sortKey]);

  /* --- activity signals (only when data supports them) --- */

  const activitySignals = useMemo(() => {
    const signals: {
      icon: "multi" | "time";
      title: string;
      sub: string;
    }[] = [];

    // Multiple pending reports for the same service
    for (const [key, count] of serviceCounts) {
      if (count >= 2) {
        const display = key === "—" ? "an unknown service" : key;
        signals.push({
          icon: "multi",
          title: `${count} incidents on ${display}`,
          sub: "May indicate a recurring issue",
        });
      }
    }

    // Time concentration: most reports on a specific day
    const byDay = new Map<string, number>();
    for (const inc of incidents) {
      const day = inc.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const [topDay, topDayCount] =
      byDay.size > 0
        ? Array.from(byDay.entries()).reduce((best, cur) =>
            cur[1] > best[1] ? cur : best,
          )
        : [null, 0];
    if (topDayCount >= 2 && topDay) {
      const isToday = topDay === new Date().toISOString().slice(0, 10);
      signals.push({
        icon: "time",
        title: isToday
          ? "Most reports: today"
          : `Most reports: ${relativeTime(`${topDay}T00:00:00Z`)}`,
        sub: `${topDayCount} of ${incidents.length} incidents reported then`,
      });
    }

    return signals;
  }, [serviceCounts, incidents]);

  /* --- empty state --- */

  if (incidents.length === 0) {
    return (
      <section aria-label="Incidents awaiting review">
        <div className="relative border border-dashed border-slate-700/60 bg-[#0b111b]/50 px-6 py-16 text-center sm:py-24">
          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#a3e635]/25 bg-[#a3e635]/8"
          >
            <span className="font-mono text-lg text-[#a3e635]">✓</span>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a3e635]">
            Queue clear
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-[#e8ece4] font-[Georgia,'Times_New_Roman',serif] sm:text-3xl">
            No reports awaiting review
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            New submissions will appear here in arrival order.
          </p>
        </div>
      </section>
    );
  }

  /* --- render --- */

  return (
    <div className="relative">
      {/* Soft depth glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 -top-10 -z-10 h-40 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.04),transparent_70%)]"
      />

      {/* ─── Summary Row ─── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryPanel
          label="Awaiting Review"
          value={String(incidents.length).padStart(2, "0")}
          sub="incidents"
        />
        <SummaryPanel
          label="Critical / Major"
          value={String(criticalMajorCount).padStart(2, "0")}
          sub={criticalMajorCount > 0 ? "need attention" : "none"}
          accent={criticalMajorCount > 0 ? severityColor.CRITICAL : undefined}
        />
        <SummaryPanel
          label="Minor"
          value={String(severityCounts.MINOR).padStart(2, "0")}
          sub="incidents"
          accent={severityCounts.MINOR > 0 ? severityColor.MINOR : undefined}
        />
        <SeverityDistribution counts={severityCounts} total={incidents.length} />
      </div>

      {/* ─── Main two-column layout ─── */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-6">
        {/* Left: Review Queue */}
        <section aria-label="Review queue" className="min-w-0">
          <div className="border border-slate-800/60 bg-[#0b111b]/40">
            {/* Queue header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/60 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <Boxes
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-slate-400"
                  />
                  <h2 className="text-sm font-semibold tracking-tight text-slate-100">
                    Review Queue
                  </h2>
                  <span className="rounded-sm bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-slate-400">
                    {filtered.length}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {filtered.length} incident
                  {filtered.length !== 1 ? "s" : ""}, ordered by{" "}
                  {sortKey === "newest"
                    ? "newest first"
                    : sortKey === "oldest"
                      ? "oldest first"
                      : "severity and report time"}
                  {serviceFilter !== "ALL"
                    ? `, filtered by ${serviceFilter}`
                    : ""}
                  .
                </p>
              </div>

              {/* Controls */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <SortControl value={sortKey} onChange={setSortKey} />
                <ServiceFilterControl
                  services={serviceList}
                  value={serviceFilter}
                  onChange={setServiceFilter}
                />
              </div>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  No matches
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  No {serviceFilter !== "ALL" ? `${serviceFilter} ` : ""}
                  reports in the queue.
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-slate-800/50">
                {filtered.map((incident, index) => (
                  <QueueRow
                    key={incident.id}
                    incident={incident}
                    index={index}
                  />
                ))}
              </ol>
            )}
          </div>

          <p className="mt-3 text-center text-[10px] leading-4 text-slate-600">
            Opening a report opens its full review page with previous / next
            navigation.
          </p>
        </section>

        {/* Right: Service Exposure + Activity & Signals */}
        <aside className="flex min-w-0 flex-col gap-4">
          {maxServiceCount > 0 && serviceList.length > 0 && (
            <ServiceExposure
              services={serviceList}
              counts={serviceCounts}
              max={maxServiceCount}
              total={incidents.length}
            />
          )}

          {activitySignals.length > 0 && (
            <div className="border border-slate-800/60 bg-[#0b111b]/40">
              <div className="border-b border-slate-800/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  />
                  <h3 className="text-xs font-semibold tracking-tight text-slate-200">
                    Activity &amp; Signals
                  </h3>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Useful context for review.
                </p>
              </div>
              <ul className="divide-y divide-slate-800/50">
                {activitySignals.map((signal) => (
                  <li key={signal.title} className="flex gap-3 px-4 py-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-slate-700/60 bg-slate-800/40"
                    >
                      {signal.icon === "multi" ? (
                        <Boxes className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200">
                        {signal.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {signal.sub}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
