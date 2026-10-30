/** @format */

"use client";

import {
  hasText,
  occurredAtLabel,
  toPreviewArchitecture,
  toPreviewRootCauseTree,
  toPreviewTimeline,
  text,
} from "./preview-format";
import { INCIDENT_PATTERN_LABELS } from "@/features/incidents/schema";
import type {
  ArchitectureDiff,
  PreventionAction,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";

/* ---------- severity hues (mirrors PublicIncidentDetail) ---------- */

const SEVERITY_HUES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  CRITICAL: {
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.4)",
    text: "#fb7185",
  },
  MAJOR: {
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.4)",
    text: "#fb7185",
  },
  MINOR: {
    bg: "rgba(198,228,124,.12)",
    border: "rgba(198,228,124,.4)",
    text: "#c6e47c",
  },
};

const STAGE_HUES: Record<string, string> = {
  TRIGGER: "#fb7185",
  FAILURE: "#fbbf24",
  PROPAGATION: "#fb7185",
  IMPACT: "#fb7185",
  DETECTION: "#fbbf24",
  MITIGATION: "#a78bfa",
  ROOT_CAUSE: "#fbbf24",
  PREVENTION: "#34d399",
};

const NODE_TYPE_LABEL: Record<string, string> = {
  ROOT_CAUSE: "Root cause",
  CONTRIBUTING_FACTOR: "Contributing factor",
  DIRECT_FAILURE: "Direct failure",
  SYSTEM_IMPACT: "System impact",
};

/* ---------- tiny shells ---------- */

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-800/70 bg-gradient-to-br from-[#0d1520] to-[#0b1219] px-5 py-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)]">
      {/* subtle top shimmer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c6e47c]/30 to-transparent"
      />
      <header className="mb-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#c6e47c]">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-[14px] font-semibold tracking-[-0.01em] text-slate-100">
          {title}
        </h3>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  const empty = !hasText(value);
  return (
    <div className={compact ? "" : "mb-3"}>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={
          empty
            ? "mt-1 text-[12px] italic leading-[1.5] text-slate-600"
            : "mt-1 text-[13px] leading-[1.6] text-slate-200"
        }
      >
        {value}
      </p>
    </div>
  );
}

/* ---------- Basic Info ---------- */

export function BasicInfoSection({
  title,
  companyName,
  occurredAt,
  durationMinutes,
  severity,
  pattern,
  summary,
  officialPostMortemUrl,
}: {
  title: string;
  companyName: string;
  occurredAt: string;
  durationMinutes: number;
  severity: string;
  pattern: string;
  summary: string;
  officialPostMortemUrl: string | undefined;
}) {
  const hue = SEVERITY_HUES[severity] ?? SEVERITY_HUES.MINOR;
  const patternLabel =
    INCIDENT_PATTERN_LABELS[pattern as keyof typeof INCIDENT_PATTERN_LABELS] ??
    pattern;

  return (
    <Card eyebrow="Basic information" title="Essentials & impact">
      <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
        {/* full-width title hero */}
        <div className="sm:col-span-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
            Incident title
          </p>
          <p className="mt-1.5 text-[18px] font-semibold leading-[1.25] tracking-[-0.02em] text-slate-100">
            {text(title)}
          </p>
        </div>

        <Field label="Company / organization" value={text(companyName)} />
        <Field label="Occurred at" value={occurredAtLabel(occurredAt)} />
        <Field label="Duration" value={`${durationMinutes} min`} />

        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
            Severity
          </p>
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-[0.05em]"
            style={{
              backgroundColor: hue.bg,
              borderColor: hue.border,
              color: hue.text,
            }}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: hue.text }}
            />
            {severity}
          </span>
        </div>

        <Field label="Failure pattern" value={patternLabel} />
        <div className="sm:col-span-2">
          <Field label="Summary" value={text(summary)} />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Official postmortem"
            value={text(officialPostMortemUrl)}
          />
        </div>
      </div>
    </Card>
  );
}

/* ---------- System & Technologies ---------- */

export function SystemSection({
  system,
  technologies,
}: {
  system: string;
  technologies: string[];
}) {
  const hasTechs = Array.isArray(technologies) && technologies.length > 0;
  return (
    <Card eyebrow="System" title="System & technologies">
      <Field label="System" value={text(system)} />
      <div className="mt-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
          Technologies
        </p>
        {hasTechs ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {technologies.map((t) => (
              <li
                key={t}
                className="rounded-md border border-slate-700/70 bg-slate-900/50 px-2.5 py-1 font-mono text-[11px] tracking-[0.02em] text-slate-300"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12px] italic leading-[1.5] text-slate-600">
            No technologies recorded
          </p>
        )}
      </div>
    </Card>
  );
}

/* ---------- Timeline ---------- */

export function TimelineSection({
  events,
  occurredAt,
}: {
  events: TimelineEvent[];
  occurredAt: string;
}) {
  const list = toPreviewTimeline(events, occurredAt);
  return (
    <Card eyebrow="Sequence" title="Timeline">
      {list.length === 0 ? (
        <p className="mt-1 text-[12px] italic leading-[1.5] text-slate-600">
          No timeline events recorded
        </p>
      ) : (
        <ol className="relative space-y-5 border-l-2 border-slate-800 pl-5">
          {list.map((event) => {
            const hue = STAGE_HUES[event.stage] ?? "#94a3b8";
            return (
              <li key={event.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1219]"
                  style={{
                    backgroundColor: hue,
                    boxShadow: `0 0 0 3px ${hue}30`,
                  }}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.06em]"
                    style={{ color: hue }}
                  >
                    {event.stage.replaceAll("_", " ")}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    T+{event.timestampOffsetMinutes}m · {event.clockLabel}
                  </span>
                </div>
                <p className="mt-1 text-[13px] font-medium text-slate-100">
                  {text(event.title)}
                </p>
                <p className="mt-0.5 text-[12px] leading-[1.6] text-slate-400">
                  {text(event.description)}
                </p>
                {hasText(event.affectedComponent) ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Affected: {event.affectedComponent}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ---------- Root Cause ---------- */

export function RootCauseSection({ nodes }: { nodes: RootCauseNode[] }) {
  const tree = toPreviewRootCauseTree(nodes);
  return (
    <Card eyebrow="Why it happened" title="Root cause analysis">
      {tree.length === 0 ? (
        <p className="mt-1 text-[12px] italic leading-[1.5] text-slate-600">
          No root-cause nodes recorded
        </p>
      ) : (
        <ul className="space-y-2">
          {tree.map((node) => (
            <li
              key={node.id}
              className="rounded-lg border border-slate-800/60 bg-[#0c151c]/60 px-3 py-2.5"
              style={{ marginLeft: `${node.depth * 14}px` }}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-400">
                  {NODE_TYPE_LABEL[node.type] ?? node.type}
                </span>
                {hasText(node.systemComponent) ? (
                  <span className="text-[11px] text-slate-500">
                    · {node.systemComponent}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[13px] text-slate-200">
                {text(node.title)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Architecture ---------- */

export function ArchitectureSection({ diff }: { diff: ArchitectureDiff }) {
  const preview = toPreviewArchitecture(diff);
  const isFact = preview.isFact;
  return (
    <Card eyebrow="What changed" title="Architecture before / after">
      <div className="flex items-center gap-2">
        <span
          className="rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em]"
          style={
            isFact
              ? {
                  color: "#d5e8a5",
                  backgroundColor: "rgba(198,228,124,.1)",
                  borderColor: "rgba(198,228,124,.4)",
                }
              : {
                  color: "#e2a16d",
                  backgroundColor: "rgba(226,161,109,.1)",
                  borderColor: "rgba(226,161,109,.4)",
                }
          }
        >
          {isFact ? "Documented facts" : "Reconstructed"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Before the fix"
          value={
            hasText(preview.beforeFix) ? preview.beforeFix : "Not recorded"
          }
        />
        <Field
          label="After the fix"
          value={hasText(preview.afterFix) ? preview.afterFix : "Not recorded"}
        />
      </div>
      {preview.hasNotes ? (
        <div className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
            Reasoning
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-[1.6] text-slate-400">
            {preview.notes}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

/* ---------- Prevention ---------- */

export function PreventionSection({
  actions,
}: {
  actions: PreventionAction[];
}) {
  return (
    <Card eyebrow="Stopping the recurrence" title="Prevention plan">
      {actions.length === 0 ? (
        <p className="mt-1 text-[12px] italic leading-[1.5] text-slate-600">
          No prevention actions recorded
        </p>
      ) : (
        <ol className="space-y-3">
          {actions.map((action, index) => (
            <li
              key={`${index}-${action.title}`}
              className="relative border-l-2 border-[#c6e47c]/40 pl-4"
            >
              <p className="text-[13px] font-medium text-slate-200">
                {text(action.title)}
              </p>
              {hasText(action.description) ? (
                <p className="mt-1 whitespace-pre-wrap text-[12px] leading-[1.6] text-slate-400">
                  {action.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
