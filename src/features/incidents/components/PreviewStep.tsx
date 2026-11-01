/** @format */

"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { IncidentFormValues } from "@/features/incidents/form-schema";
import {
  occurredAtLabel,
  toPreviewRootCauseTree,
  toPreviewTimeline,
} from "./preview/preview-format";
import { INCIDENT_PATTERN_LABELS } from "@/features/incidents/schema";

const checklistSections = [
  {
    title: "Basic information",
    detail: "Title, organization, date, and summary",
  },
  {
    title: "System & technologies",
    detail: "System name and at least one technology",
  },
  {
    title: "Timeline",
    detail: "Ordered events, including the trigger at minute zero",
  },
  {
    title: "Root cause & architecture",
    detail: "A valid cause tree and architecture comparison",
  },
  {
    title: "Prevention & review",
    detail: "At least one prevention action",
  },
] as const;

const severityStyles: Record<string, string> = {
  CRITICAL: "border-rose-400/40 bg-rose-400/[0.08] text-rose-300",
  MAJOR: "border-orange-300/40 bg-orange-300/[0.08] text-orange-200",
  MINOR: "border-[#c6e47c]/40 bg-[#c6e47c]/[0.08] text-[#d5e8a5]",
};

function displayText(value: string | null | undefined, fallback = "Not provided") {
  return value?.trim() ? value.trim() : fallback;
}

function safeExternalHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 break-words text-[12px] leading-5 text-slate-300">
        {children}
      </div>
    </div>
  );
}

function BriefSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-800/80 py-4 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-baseline gap-3">
        <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#c6e47c]">
          {eyebrow}
        </p>
        <h3 className="text-[13px] font-semibold text-slate-100">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function PreviewStep({
  onNavigateToStep,
  validateStep,
}: {
  onNavigateToStep?: (step: number) => void;
  validateStep?: (step: number) => Promise<boolean>;
}) {
  const { watch } = useFormContext<IncidentFormValues>();
  const values = watch();
  const [sectionValidity, setSectionValidity] = useState<
    (boolean | null)[]
  >(() => checklistSections.map(() => null));
  const timeline = toPreviewTimeline(values.timeline ?? [], values.occurredAt);
  const tree = toPreviewRootCauseTree(values.rootCauseTree ?? []);
  const nodesById = new Map(tree.map((node) => [node.id, node]));
  const postMortemHref = values.officialPostMortemUrl?.trim()
    ? safeExternalHref(values.officialPostMortemUrl)
    : null;
  const patternLabel =
    INCIDENT_PATTERN_LABELS[values.pattern] ?? values.pattern;

  useEffect(() => {
    let active = true;

    async function checkSections() {
      if (!validateStep) return;
      const results: boolean[] = [];
      for (let index = 0; index < checklistSections.length; index += 1) {
        results.push(await validateStep(index));
        if (active) {
          setSectionValidity((current) =>
            current.map((valid, sectionIndex) =>
              sectionIndex === index ? results[index] : valid,
            ),
          );
        }
      }
    }

    void checkSections();
    return () => {
      active = false;
    };
  }, [validateStep]);

  const validCount = sectionValidity.filter((valid) => valid === true).length;
  const allValid =
    sectionValidity.length > 0 &&
    sectionValidity.every((valid) => valid === true);

  return (
    <div
      aria-label="Incident report preview"
      role="region"
      className="space-y-4"
    >
      <header className="border-b border-[#c6e47c]/50 pb-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#c6e47c]">
          Final review
        </p>
        <h2 className="mt-1 font-serif text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.05] tracking-[-0.035em] text-[#f1f1e9]">
          Review your <span className="text-[#c6e47c] italic">incident.</span>
          <span className="sr-only"> Final preview</span>
        </h2>
        <p className="mt-2 text-[12px] leading-5 text-slate-400">
          One last check before this report is submitted.
        </p>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(260px,0.95fr)]">
        <article className="min-w-0 rounded-lg border border-slate-800/80 bg-gradient-to-br from-[#0d1520] to-[#0b1219] p-4 sm:p-5">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">
            Incident brief
          </p>

          <div className="flex flex-wrap items-start gap-3">
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] ${
                severityStyles[values.severity] ?? severityStyles.MINOR
              }`}
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
              {values.severity}
            </span>
            <h3 className="min-w-0 flex-1 font-serif text-[clamp(1.25rem,2.4vw,1.75rem)] leading-tight tracking-[-0.02em] text-slate-100">
              {displayText(values.title, "Untitled incident")}
            </h3>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-800/80 pb-4 sm:grid-cols-4">
            <MetaItem label="Organization">{displayText(values.companyName)}</MetaItem>
            <MetaItem label="System">{displayText(values.system)}</MetaItem>
            <MetaItem label="Occurred">{occurredAtLabel(values.occurredAt)}</MetaItem>
            <MetaItem label="Duration">
              {values.durationMinutes > 0
                ? `${values.durationMinutes} minutes`
                : "Not provided"}
            </MetaItem>
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <MetaItem label="Failure pattern">{patternLabel}</MetaItem>
            {values.technologies?.length ? (
              <MetaItem label="Technologies">
                {values.technologies.join(" · ")}
              </MetaItem>
            ) : null}
          </div>

          <BriefSection eyebrow="Summary" title="What happened">
            <p className="whitespace-pre-wrap break-words text-[12px] leading-[1.65] text-slate-300">
              {displayText(values.summary)}
            </p>
          </BriefSection>

          <BriefSection eyebrow="Sequence" title="Event timeline">
            {timeline.length === 0 ? (
              <p className="text-[12px] italic text-slate-500">
                No timeline events recorded.
              </p>
            ) : (
              <ol className="divide-y divide-slate-800/70">
                {timeline.map((event) => (
                  <li
                    key={event.id}
                    className="grid min-w-0 gap-1 py-2 first:pt-0 sm:grid-cols-[minmax(90px,0.48fr)_minmax(0,1.52fr)] sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-300">
                        {event.stage.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                        T+{event.timestampOffsetMinutes}m · {event.clockLabel}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-[12px] font-medium text-slate-200">
                        {displayText(event.title)}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-slate-400">
                        {displayText(event.description)}
                      </p>
                      {event.affectedComponent?.trim() ? (
                        <p className="mt-1 break-words text-[10px] text-slate-500">
                          Affected: {event.affectedComponent}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </BriefSection>

          <BriefSection eyebrow="Analysis" title="Root cause">
            {tree.length === 0 ? (
              <p className="text-[12px] italic text-slate-500">
                No root-cause nodes recorded.
              </p>
            ) : (
              <ul className="space-y-2">
                {tree.map((node) => {
                  const parent = node.parentId
                    ? nodesById.get(node.parentId)
                    : undefined;
                  return (
                    <li
                      key={node.id}
                      className="min-w-0 border-l border-slate-700 pl-3"
                      style={{ marginInlineStart: `${Math.min(node.depth, 5) * 12}px` }}
                    >
                      <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#c6e47c]">
                        {node.type.replaceAll("_", " ")}
                        {parent
                          ? ` · under ${displayText(parent.title, "untitled parent")}`
                          : ""}
                      </p>
                      <p className="mt-0.5 break-words text-[12px] font-medium text-slate-200">
                        {displayText(node.title)}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-slate-400">
                        {displayText(node.description)}
                      </p>
                      {node.systemComponent?.trim() ? (
                        <p className="mt-1 break-words text-[10px] text-slate-500">
                          Component: {node.systemComponent}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </BriefSection>

          <BriefSection eyebrow="Change" title="Architecture before / after">
            <div className="mb-2">
              <span
                className={`rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] ${
                  values.architectureDiff.isFact
                    ? "border-[#c6e47c]/30 bg-[#c6e47c]/[0.06] text-[#d5e8a5]"
                    : "border-orange-300/30 bg-orange-300/[0.06] text-orange-200"
                }`}
              >
                {values.architectureDiff.isFact
                  ? "Documented fact"
                  : "Reconstructed"}
              </span>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
                  Before the fix
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-[1.6] text-slate-300">
                  {displayText(values.architectureDiff.beforeFix)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
                  After the fix
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-[1.6] text-slate-300">
                  {displayText(values.architectureDiff.afterFix)}
                </p>
              </div>
            </div>
            {!values.architectureDiff.isFact &&
            values.architectureDiff.notes?.trim() ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-slate-400">
                Reconstruction notes: {values.architectureDiff.notes}
              </p>
            ) : null}
          </BriefSection>

          <BriefSection eyebrow="Prevention" title="Prevention plan">
            {values.preventionActions.length === 0 ? (
              <p className="text-[12px] italic text-slate-500">
                No prevention actions recorded.
              </p>
            ) : (
              <ul className="space-y-2">
                {values.preventionActions.map((action, index) => (
                  <li
                    key={`${index}-${action.title}`}
                    className="min-w-0 border-l border-[#c6e47c]/40 pl-3"
                  >
                    <p className="break-words text-[12px] font-medium text-slate-200">
                      {displayText(action.title)}
                    </p>
                    {action.description?.trim() ? (
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-slate-400">
                        {action.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </BriefSection>

          {values.officialPostMortemUrl?.trim() ? (
            <div className="border-t border-slate-800/80 pt-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                Official postmortem
              </p>
              {postMortemHref ? (
                <a
                  href={postMortemHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block max-w-full break-all text-[11px] text-[#c6e47c] underline decoration-[#c6e47c]/40 underline-offset-2 hover:text-[#dcf7a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
                >
                  {values.officialPostMortemUrl}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <p className="mt-1 break-all text-[11px] text-slate-300">
                  {values.officialPostMortemUrl}
                </p>
              )}
            </div>
          ) : null}
        </article>

        <aside className="min-w-0 rounded-lg border border-slate-800/80 bg-[#0b1219]/80 p-4 sm:p-5">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-100">
            Submission Checklist
          </h3>
          <p className="mt-1 text-[11px] leading-[1.55] text-slate-400">
            Check each section against the report requirements.
          </p>

          <ol className="mt-4 divide-y divide-slate-800/80 border-y border-slate-800/80">
            {checklistSections.map((section, index) => {
              const valid = sectionValidity[index];
              return (
                <li
                  key={section.title}
                  className="flex min-w-0 items-start gap-2.5 py-3"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      valid === true
                        ? "border-[#c6e47c] bg-[#c6e47c] text-[#11190a]"
                        : valid === false
                          ? "border-rose-400/70 text-rose-300"
                          : "border-slate-600 text-slate-500"
                    }`}
                  >
                    {valid === true ? "✓" : valid === false ? "!" : "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-4 text-slate-200">
                      {section.title}
                      {valid === null ? (
                        <span className="ml-1 font-normal text-slate-500">
                          Checking…
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-[1.5] text-slate-500">
                      {valid === false ? "Needs attention. " : ""}
                      {section.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!onNavigateToStep}
                    onClick={() => onNavigateToStep?.(index)}
                    className="shrink-0 rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] text-slate-400 underline underline-offset-2 transition-colors hover:text-[#d5e8a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Edit
                    <span className="sr-only"> {section.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            aria-live="polite"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <p className="text-[11px] font-medium text-slate-200">
              {sectionValidity.some((valid) => valid === null)
                ? "Checking required sections…"
                : allValid
                  ? "Required information is ready."
                  : "Review the sections marked for attention."}
            </p>
            <span
              className={`shrink-0 font-mono text-[10px] ${
                allValid ? "text-[#d5e8a5]" : "text-slate-400"
              }`}
            >
              {validCount} / {checklistSections.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Required sections validated"
            aria-valuemin={0}
            aria-valuemax={checklistSections.length}
            aria-valuenow={validCount}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-[#c6e47c] transition-[width]"
              style={{
                width: `${(validCount / checklistSections.length) * 100}%`,
              }}
            />
          </div>

          <p className="mt-3 text-[10px] leading-[1.5] text-slate-500">
            Official postmortem link is optional.
          </p>
        </aside>
      </div>
    </div>
  );
}
