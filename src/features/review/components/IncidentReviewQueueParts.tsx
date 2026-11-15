import Link from "next/link";
import { ArrowRight, Cpu, Filter, UserRound } from "lucide-react";
import { formatDate } from "./visualization-shared";
import type { ReviewIncident } from "@/features/review/server/queries";
import {
  severityColor,
  type SeverityKey,
  type ServiceFilter,
  type SortKey,
  relativeTime,
  initials,
} from "./incident-review-queue-shared";
/* ---------- sub-components ---------- */

/** Compact summary panel. */
export function SummaryPanel({
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
export function SeverityDistribution({
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
export function SortControl({
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
export function ServiceFilterControl({
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
export function QueueRow({
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
export function ServiceExposure({
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
