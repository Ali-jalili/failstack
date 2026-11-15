/** @format */

"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  GitBranch,
  Network,
  Shield,
  Target,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { TimelineEvent } from "@/types/incident";
import { formatLabel } from "@/features/review/components/visualization-shared";

const stageIcons: Record<TimelineEvent["stage"], LucideIcon> = {
  TRIGGER: AlertTriangle,
  FAILURE: Circle,
  PROPAGATION: Network,
  IMPACT: Shield,
  DETECTION: Target,
  MITIGATION: GitBranch,
  ROOT_CAUSE: Waypoints,
  PREVENTION: CheckCircle2,
};

const stageColors: Record<TimelineEvent["stage"], string> = {
  TRIGGER: "#c6e47c",
  FAILURE: "#3b82f6",
  PROPAGATION: "#f43f5e",
  IMPACT: "#f43f5e",
  DETECTION: "#3b82f6",
  MITIGATION: "#8b5cf6",
  ROOT_CAUSE: "#c6e47c",
  PREVENTION: "#94a3b8",
};

export function IncidentTimeline({
  events,
  stageMeta,
}: {
  events: TimelineEvent[];
  stageMeta?: string;
}) {
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => a.timestampOffsetMinutes - b.timestampOffsetMinutes,
      ),
    [events],
  );
  const [activeId, setActiveId] = useState(sorted[0]?.id ?? null);
  const active = sorted.find((e) => e.id === activeId) ?? sorted[0];

  if (!active) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No timeline events were submitted.
      </p>
    );
  }

  const ActiveIcon = stageIcons[active.stage] ?? Circle;
  const activeColor = stageColors[active.stage] ?? "#c6e47c";

  return (
    <div className="mt-8">
      {/* horizontal timeline */}
      <div className="review-timeline-track pb-1">
        <ol
          aria-label="Incident events in chronological order"
          className="relative flex w-full min-w-0 items-start gap-0"
        >
          {sorted.map((event, i) => {
            const Icon = stageIcons[event.stage] ?? Circle;
            const color = stageColors[event.stage] ?? "#94a3b8";
            const isActive = event.id === active.id;
            const isLast = i === sorted.length - 1;

            return (
              <li
                key={event.id}
                className="relative flex min-w-0 flex-1 flex-col items-center"
              >
                <div className="relative z-10 flex w-full items-center justify-center  mt-1.5">
                  {!isLast && (
                    <span
                      aria-hidden
                      className="review-timeline-connector absolute left-1/2 top-1/2 h-px -translate-y-1/2"
                      style={{
                        width: "100%",
                        background: `linear-gradient(90deg, ${color}aa, ${stageColors[sorted[i + 1].stage] ?? "#94a3b8"}aa)`,
                      }}
                    />
                  )}
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(event.id)}
                    className={`group relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#0b111b] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] ${
                      isActive
                        ? "scale-110 shadow-[0_0_0_4px_rgba(198,228,124,0.15)]"
                        : "hover:scale-105"
                    }`}
                    style={{
                      borderColor: color,
                      boxShadow: isActive ? `0 0 18px ${color}44` : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} aria-hidden />
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-full opacity-20 motion-reduce:animate-none"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                </div>

                <div className="mt-3 w-full min-w-0 px-1 text-center">
                  <p
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive ? "font-semibold" : "text-slate-500"
                    }`}
                    style={isActive ? { color } : undefined}
                  >
                    T+{event.timestampOffsetMinutes}m
                  </p>
                  <p
                    className={`review-timeline-stage mt-0.5 text-[11px] font-medium ${
                      isActive ? "text-slate-200" : "text-slate-400"
                    }`}
                  >
                    {formatLabel(event.stage)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* detail card */}
      <article
        key={active.id}
        aria-live="polite"
        className="review-selection-enter mt-5 rounded-md border border-slate-800 bg-[#0b111b]/80 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]"
            style={{
              color: activeColor,
              borderColor: `${activeColor}55`,
              backgroundColor: `${activeColor}14`,
            }}
          >
            <ActiveIcon className="h-3 w-3" aria-hidden />
            T+{active.timestampOffsetMinutes}m · {formatLabel(active.stage)}
          </span>
          <h4 className="min-w-0 flex-1 break-words text-base font-medium text-slate-100 sm:text-lg">
            {active.title}
          </h4>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
          {active.description}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800/80 pt-3 text-[11px]">
          <div>
            <dt className="inline text-slate-500">Affected component </dt>
            <dd className="inline text-slate-300">
              {active.affectedComponent}
            </dd>
          </div>
          {stageMeta && (
            <div>
              <dt className="inline text-slate-500">Stage </dt>
              <dd className="inline text-slate-300">{stageMeta}</dd>
            </div>
          )}
        </dl>

        {active.cliCommands && active.cliCommands.length > 0 && (
          <details className="group mt-4 border-t border-slate-800 pt-3">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-300">
              Inspect {active.cliCommands.length} command
              {active.cliCommands.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-2">
              {active.cliCommands.map((cmd, i) => (
                <li key={i}>
                  <pre className="overflow-x-auto border-l-2 border-[#c6e47c]/40 bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-[#c6e47c]">
                    {cmd}
                  </pre>
                </li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </div>
  );
}
