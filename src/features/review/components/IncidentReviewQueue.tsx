/** @format */

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Clock,
  Cpu,
  Filter,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate } from "./visualization-shared";
import type { ReviewIncident } from "@/features/review/server/queries";

/* ---------- types & constants ---------- */

type SeverityKey = "CRITICAL" | "MAJOR" | "MINOR";
type SortKey = "default" | "priority" | "newest" | "oldest";
type ServiceFilter = string; // "ALL" or a system name

const SEVERITIES: SeverityKey[] = ["CRITICAL", "MAJOR", "MINOR"];
const SEVERITY_RANK: Record<SeverityKey, number> = {
  CRITICAL: 0,
  MAJOR: 1,
  MINOR: 2,
};

/** Solid accent colors for severity dots, badges, and bars. */
const severityColor: Record<SeverityKey, string> = {
  CRITICAL: "#fb7185",
  MAJOR: "#fcd34d",
  MINOR: "#a3e635",
};

/* ---------- helpers ---------- */

/**
 * The dedicated review workspace: every pending incident rendered as a
 * compact, scannable row inside a two-column layout (queue + context
 * panels). All summary metrics and signals are derived from the real
 * queue data passed in by the server — nothing is fabricated.
 */

/** Relative, human-friendly time ("just now", "3h ago", "5d ago"). */
function relativeTime(value: string, now = Date.now()): string {
  const then = Date.parse(value);
  if (Number.isNaN(then)) return formatDate(value);
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Initials for the reporter badge, falling back to email. */
function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
      : source.slice(0, 2);
  return letters ? letters.toUpperCase() : "?";
}

/** Normalised service key for grouping; safe when system is empty. */
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

/* ---------- sub-components ---------- */

/** Compact summary panel. */
function SummaryPanel({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden border border-slate-800/60 bg-[#0b111b]/40 px-4 py-3.5">
      {accent && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-0.75"
          style={{ backgroundColor: accent, opacity: 0.6 }}
        />
      )}
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-[2rem] font-bold leading-none tabular-nums text-slate-100">
        {value}
      </p>
      {sub && <p className="mt-1 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

/** Severity distribution stacked bar with counts. */
function SeverityDistribution({
  counts,
  total,
}: {
  counts: Record<SeverityKey, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="border border-slate-800/60 bg-[#0b111b]/40 px-4 py-3.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
          By Severity
        </p>
        <p className="mt-3 text-sm text-slate-400">No pending incidents</p>
      </div>
    );
  }

  const segments: { sev: SeverityKey; count: number }[] = [
    { sev: "CRITICAL", count: counts.CRITICAL },
    { sev: "MAJOR", count: counts.MAJOR },
    { sev: "MINOR", count: counts.MINOR },
  ];

  return (
    <div className="border border-slate-800/60 bg-[#0b111b]/40 px-4 py-3.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
        By Severity
      </p>

      <div
        className="mt-2.5 flex h-2 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label={`Severity distribution: ${counts.CRITICAL} critical, ${counts.MAJOR} major, ${counts.MINOR} minor out of ${total}`}
      >
        {segments.map(
          ({ sev, count }) =>
            count > 0 && (
              <span
                key={sev}
                aria-hidden="true"
                className="block h-full"
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: severityColor[sev],
                  opacity: sev === "MINOR" ? 0.85 : 1,
                }}
              />
            ),
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map(({ sev, count }) => (
          <span
            key={sev}
            className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: severityColor[sev] }}
            />
            <span className="capitalize">{sev}</span>
            <span className="font-mono tabular-nums text-slate-500">
              {count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Sort dropdown — native select styled to match the dark theme. */
function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <label className="relative flex items-center gap-1.5 text-[11px] text-slate-500">
      <Filter aria-hidden="true" className="h-3 w-3" />
      <span className="sr-only">Sort queue</span>
      <select
        aria-label="Sort queue"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="min-h-7 cursor-pointer appearance-none rounded-sm border border-slate-700/80 bg-slate-900/60 pl-2 pr-6 text-[11px] text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50"
      >
        <option value="default">Priority (High → Low)</option>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 text-slate-500"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M3 4l2 2 2-2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

/** Service filter dropdown — native select. */
function ServiceFilterControl({
  services,
  value,
  onChange,
}: {
  services: { value: string; label: string }[];
  value: ServiceFilter;
  onChange: (v: ServiceFilter) => void;
}) {
  if (services.length === 0) return null;
  return (
    <label className="relative flex items-center gap-1.5 text-[11px] text-slate-500">
      <span className="sr-only">Filter by service</span>
      <select
        aria-label="Filter by service"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-7 max-w-40 cursor-pointer appearance-none rounded-sm border border-slate-700/80 bg-slate-900/60 pl-2 pr-6 text-[11px] text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-[#a3e635]/50"
      >
        <option value="ALL">All Services</option>
        {services.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 text-slate-500"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M3 4l2 2 2-2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

/** Dense row for one incident in the queue. */
function QueueRow({
  incident,
  index,
}: {
  incident: ReviewIncident;
  index: number;
}) {
  const sev = incident.severity as SeverityKey;
  const color = severityColor[sev] ?? "#64748b";
  const authorName = incident.author_name ?? incident.author_email;
  const hasAuthor = Boolean(authorName);
  const techs = incident.technologies.slice(0, 3);
  const isCritical = sev === "CRITICAL";

  return (
    <li className="relative">
      <Link
        href={`/review/incidents/${incident.id}`}
        aria-label={`${incident.title} — ${sev.toLowerCase()} — open review`}
        className="group review-card flex items-stretch px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] sm:px-5 motion-reduce:transition-none"
        style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      >
        {/* Left: sequence + severity dot */}
        <div className="flex w-10 shrink-0 items-start gap-2.5 pt-1 sm:w-12">
          <span
            aria-hidden="true"
            className="font-mono text-[11px] leading-5 text-slate-600"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            aria-hidden="true"
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              isCritical ? "review-rail-pulse" : ""
            }`}
            style={{
              backgroundColor: color,
              boxShadow: isCritical ? `0 0 6px ${color}` : "none",
            }}
          />
        </div>

        {/* Center: main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{
                color,
                borderColor: `${color}55`,
                backgroundColor: `${color}12`,
              }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
              {sev}
            </span>
            <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">
              {incident.system}
            </span>
          </div>

          <h3 className="wrap-break-word text-[13px] font-semibold leading-snug tracking-tight text-slate-100 transition-colors group-hover:text-white motion-reduce:transition-none">
            {incident.title}
          </h3>

          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            <span className="text-slate-400">{incident.company_name}</span>
            <span className="mx-1 text-slate-700">/</span>
            {incident.system}
          </p>

          {techs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {techs.map((tech) => (
                <span
                  key={tech}
                  className="rounded-sm border border-slate-800/70 bg-slate-900/40 px-1.5 py-0.5 text-[10px] text-slate-400"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: reporter + time + arrow */}
        <div className="ml-3 flex shrink-0 items-center gap-3 sm:ml-4">
          {hasAuthor ? (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[10px] font-semibold"
              style={{
                color,
                borderColor: `${color}33`,
                backgroundColor: `${color}0c`,
              }}
            >
              {initials(incident.author_name, incident.author_email)}
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/30 text-slate-500"
            >
              <UserRound className="h-3.5 w-3.5" />
            </span>
          )}

          <div className="hidden flex-col sm:flex">
            {hasAuthor && (
              <span className="max-w-24 truncate text-[11px] text-slate-300">
                {authorName}
              </span>
            )}
            <span
              title={`Submitted ${formatDate(incident.created_at)} UTC`}
              className="whitespace-nowrap text-[10px] tabular-nums text-slate-500"
            >
              {relativeTime(incident.created_at)}
            </span>
          </div>

          <span
            className="whitespace-nowrap text-[10px] tabular-nums text-slate-500 sm:hidden"
            title={`Submitted ${formatDate(incident.created_at)} UTC`}
          >
            {relativeTime(incident.created_at)}
          </span>

          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center text-slate-700 transition-colors group-hover:text-[#a3e635] motion-reduce:transition-none"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}

/** Compact panel showing pending incidents grouped by service. */
function ServiceExposure({
  services,
  counts,
  max,
  total,
}: {
  services: { value: string; label: string }[];
  counts: Map<string, number>;
  max: number;
  total: number;
}) {
  return (
    <div className="border border-slate-800/60 bg-[#0b111b]/40">
      <div className="border-b border-slate-800/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
          />
          <h3 className="text-xs font-semibold tracking-tight text-slate-200">
            Service Exposure
          </h3>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Pending incidents by service.
        </p>
      </div>

      <ul className="divide-y divide-slate-800/40">
        {services
          .map((s) => ({ ...s, count: counts.get(s.value) ?? 0 }))
          .sort((a, b) => b.count - a.count)
          .map((svc) => (
            <li key={svc.value} className="flex items-center gap-2 px-4 py-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                {svc.label}
              </span>
              <span
                className="relative h-1.5 w-16 shrink-0 overflow-hidden rounded-sm bg-slate-800/60"
                aria-hidden="true"
              >
                <span
                  className="absolute left-0 top-0 h-full rounded-sm"
                  style={{
                    width: `${max > 0 ? (svc.count / max) * 100 : 0}%`,
                    backgroundColor:
                      svc.count > 2
                        ? "#fb7185"
                        : svc.count > 1
                          ? "#fcd34d"
                          : "#a3e635",
                    opacity: 0.8,
                  }}
                />
              </span>
              <span className="w-4 text-right font-mono text-[11px] tabular-nums text-slate-400">
                {svc.count}
              </span>
            </li>
          ))}
      </ul>

      <div className="border-t border-slate-800/60 px-4 py-2">
        <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
          {total} total pending · {services.length} service
          {services.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
