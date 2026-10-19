"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, List, RefreshCw, X } from "lucide-react";
import { reviewIncident } from "@/features/review/server/actions";
import type { ReviewIncident } from "@/features/review/server/queries";
import type { RootCauseNode } from "@/types/incident";

const severityStyles: Record<string, string> = {
  CRITICAL: "text-rose-300",
  MAJOR: "text-amber-200",
  MINOR: "text-[#c6e47c]",
};

const causeTypeStyles = {
  ROOT_CAUSE: "text-rose-300 before:bg-rose-400",
  CONTRIBUTING_FACTOR: "text-amber-200 before:bg-amber-300",
  DIRECT_FAILURE: "text-violet-300 before:bg-violet-400",
  SYSTEM_IMPACT: "text-slate-300 before:bg-slate-500",
} as const;

type ReviewSectionId = "timeline" | "causes" | "architecture" | "prevention";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function SectionLabel({
  index,
  title,
}: {
  index: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
      <span className="text-[#c6e47c]">{index}</span>
      {title}
    </h3>
  );
}

function TimelineExplorer({ incident }: { incident: ReviewIncident }) {
  const events = useMemo(
    () =>
      [...incident.timeline].sort(
        (first, second) =>
          first.timestampOffsetMinutes - second.timestampOffsetMinutes,
      ),
    [incident.timeline],
  );
  const [activeEventId, setActiveEventId] = useState(events[0]?.id ?? null);
  const activeEvent = events.find((event) => event.id === activeEventId) ?? events[0];

  if (!activeEvent) {
    return <p className="mt-4 text-sm text-slate-500">No timeline events were submitted.</p>;
  }

  return (
    <div className="mt-4 grid gap-5 md:grid-cols-[minmax(9rem,0.38fr)_minmax(0,1fr)] md:gap-8">
      <ol aria-label="Incident events in chronological order" className="relative space-y-1 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-slate-800">
        {events.map((event, index) => {
          const isActive = event.id === activeEvent.id;

          return (
            <li key={event.id} className="relative">
              <button
                type="button"
                aria-pressed={isActive}
                aria-label={`${formatLabel(event.stage)} at T plus ${event.timestampOffsetMinutes} minutes: ${event.title}`}
                onClick={() => setActiveEventId(event.id)}
                className="group flex min-h-11 w-full items-start gap-3 rounded-sm px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rotate-45 border transition-colors motion-reduce:transition-none ${
                    isActive
                      ? "border-[#c6e47c] bg-[#c6e47c]"
                      : "border-slate-600 bg-[#080d16] group-hover:border-[#c6e47c]"
                  }`}
                />
                <span className="min-w-0">
                  <span className={`block font-mono text-[10px] tabular-nums ${isActive ? "text-[#c6e47c]" : "text-slate-500"}`}>
                    T+{event.timestampOffsetMinutes}m
                    <span className="mx-1.5 text-slate-700">/</span>
                    {formatLabel(event.stage)}
                  </span>
                  <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200"}`}>
                    {event.title}
                  </span>
                  {index === 0 && (
                    <span className="sr-only">First event in chronological order</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <article
        key={activeEvent.id}
        aria-live="polite"
        className="review-selection-enter min-w-0 border-l border-slate-800 pl-4 sm:pl-5"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          {formatLabel(activeEvent.stage)} · T+{activeEvent.timestampOffsetMinutes}m
        </p>
        <h4 className="mt-2 text-lg font-medium leading-snug text-slate-100 [font-family:Georgia,'Times_New_Roman',serif]">
          {activeEvent.title}
        </h4>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
          {activeEvent.description}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Affected component <span className="ml-2 text-slate-300">{activeEvent.affectedComponent}</span>
        </p>
        {activeEvent.cliCommands && activeEvent.cliCommands.length > 0 && (
          <details className="group mt-4 border-t border-slate-800 pt-3">
            <summary className="min-h-9 cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 marker:hidden hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] [&::-webkit-details-marker]:hidden">
              Inspect {activeEvent.cliCommands.length} command{activeEvent.cliCommands.length === 1 ? "" : "s"}
              <span aria-hidden="true" className="ml-2 text-[#c6e47c] transition-transform group-open:inline-block group-open:rotate-90 motion-reduce:transition-none">›</span>
            </summary>
            <ul className="mt-3 space-y-2">
              {activeEvent.cliCommands.map((command, index) => (
                <li key={`${activeEvent.id}-command-${index}`}>
                  <pre className="overflow-x-auto border-l border-[#c6e47c]/40 bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-[#c6e47c]"><code>{command}</code></pre>
                </li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </div>
  );
}

function RootCauseExplorer({ nodes }: { nodes: RootCauseNode[] }) {
  const firstNodeId = nodes[0]?.id ?? null;
  const [activeNodeId, setActiveNodeId] = useState(firstNodeId);
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const childrenByParent = useMemo(() => {
    const result = new Map<string | null, RootCauseNode[]>();
    for (const node of nodes) {
      const siblings = result.get(node.parentId) ?? [];
      siblings.push(node);
      result.set(node.parentId, siblings);
    }
    return result;
  }, [nodes]);
  const activeNode = nodes.find((node) => node.id === activeNodeId) ?? nodes[0];

  const connectedIds = useMemo(() => {
    const connected = new Set<string>();
    let node: RootCauseNode | undefined = activeNode;
    while (node && !connected.has(node.id)) {
      connected.add(node.id);
      node = node.parentId ? nodesById.get(node.parentId) : undefined;
    }
    if (activeNode) {
      for (const child of childrenByParent.get(activeNode.id) ?? []) {
        connected.add(child.id);
      }
    }
    return connected;
  }, [activeNode, childrenByParent, nodesById]);

  if (!activeNode) {
    return <p className="mt-4 text-sm text-slate-500">No root cause analysis was submitted.</p>;
  }

  const visited = new Set<string>();

  function renderNode(node: RootCauseNode, path: Set<string>): ReactNode {
    if (path.has(node.id) || visited.has(node.id)) return null;
    visited.add(node.id);
    const nextPath = new Set(path).add(node.id);
    const isSelected = node.id === activeNode.id;
    const isConnected = connectedIds.has(node.id);
    const children = childrenByParent.get(node.id) ?? [];
    const typeStyle = causeTypeStyles[node.type];

    return (
      <li key={node.id} className="relative min-w-0">
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={`${formatLabel(node.type)}: ${node.title}; component ${node.systemComponent}`}
          onClick={() => setActiveNodeId(node.id)}
          className={`relative block min-h-11 w-full border-l py-2 pl-4 pr-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] ${
            isSelected
              ? "border-[#c6e47c] bg-[#c6e47c]/[0.06]"
              : isConnected
                ? "border-[#c6e47c]/45 hover:bg-white/[0.025]"
                : "border-slate-800 hover:border-slate-600 hover:bg-white/[0.025]"
          }`}
        >
          <span className={`before:mr-2 before:inline-block before:h-1.5 before:w-1.5 before:rotate-45 ${typeStyle} font-mono text-[9px] uppercase tracking-[0.09em]`}>
            {formatLabel(node.type)} <span className="text-slate-700">/</span> {node.systemComponent}
          </span>
          <span className={`mt-1 block text-sm leading-5 ${isSelected ? "text-[#e8ece4]" : "text-slate-300"}`}>
            {node.title}
          </span>
        </button>
        {children.length > 0 && (
          <ol className="ml-3 mt-1 space-y-1 border-l border-slate-800 pl-3 sm:ml-4 sm:pl-4">
            {children.map((child) => renderNode(child, nextPath))}
          </ol>
        )}
      </li>
    );
  }

  const roots = childrenByParent.get(null) ?? [];
  const renderedRoots = roots.map((node) => renderNode(node, new Set()));
  const disconnected = nodes.filter((node) => !visited.has(node.id));

  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(15rem,1.1fr)] lg:gap-8">
      <div>
        <ol className="space-y-2">{renderedRoots}</ol>
        {disconnected.length > 0 && (
          <div className="mt-4 border-t border-dashed border-slate-800 pt-3">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">
              Unlinked entries · relationship not established
            </p>
            <ol className="space-y-2">
              {disconnected.map((node) => renderNode(node, new Set()))}
            </ol>
          </div>
        )}
      </div>
      <article aria-live="polite" className="min-w-0 border-l border-slate-800 pl-4 sm:pl-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#c6e47c]">
          Selected factor · {formatLabel(activeNode.type)}
        </p>
        <h4 className="mt-2 text-lg font-medium leading-snug text-slate-100 [font-family:Georgia,'Times_New_Roman',serif]">
          {activeNode.title}
        </h4>
        <p className="mt-1 text-xs text-slate-500">{activeNode.systemComponent}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
          {activeNode.description}
        </p>
        <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] leading-5 text-slate-600">
          Type labels and markers distinguish cause, contributing factor, direct failure, and impact. Lime connectors trace the recorded parent path and direct children; other branches keep their submitted relationships.
        </p>
      </article>
    </div>
  );
}

function IncidentInvestigation({
  incident,
  activeSection,
  onReviewed,
  onRefresh,
}: {
  incident: ReviewIncident;
  activeSection: ReviewSectionId;
  onReviewed: (message: string) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <header className="review-panel-enter border-b border-slate-800/80 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${severityStyles[incident.severity] ?? "text-slate-300"}`}>
            {incident.severity} severity
          </span>
          <span className="h-1 w-1 rotate-45 bg-slate-600" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#c6e47c]">Awaiting review</span>
          <time dateTime={incident.created_at} className="text-[11px] text-slate-600">
            Submitted {formatDate(incident.created_at)} UTC
          </time>
        </div>
        <h2 className="mt-4 break-words text-[clamp(1.8rem,3vw,2.8rem)] font-normal leading-[1.08] tracking-[-0.045em] text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
          {incident.title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          <span className="text-slate-200">{incident.company_name}</span>
          <span className="mx-2 text-slate-700">/</span>{incident.system}
        </p>
        <p className="mt-5 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {incident.summary}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">Incident time</dt>
            <dd className="mt-1 text-xs text-slate-300">{formatDate(incident.occurred_at)} UTC</dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">Duration</dt>
            <dd className="mt-1 text-xs text-slate-300">{incident.duration_minutes} minutes</dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">Pattern</dt>
            <dd className="mt-1 text-xs capitalize text-slate-300">{formatLabel(incident.pattern)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">Technologies</dt>
            <dd className="mt-1 text-xs text-slate-300">{incident.technologies.length ? incident.technologies.join(" · ") : "Not specified"}</dd>
          </div>
        </dl>
      </header>

      <div
        id={`review-sections-${incident.id}`}
        className="review-investigation-sections px-5 py-6 sm:px-7 sm:py-7"
        data-active-section={activeSection}
      >
        <section
          data-review-section="timeline"
          aria-labelledby={`timeline-${incident.id}`}
          className={`review-mobile-section review-section-enter ${activeSection === "timeline" ? "review-mobile-active" : ""}`}
        >
          <SectionLabel index="01" title="Incident timeline" />
          <h3 id={`timeline-${incident.id}`} className="sr-only">Interactive incident timeline</h3>
          <TimelineExplorer incident={incident} />
        </section>

        <section
          data-review-section="causes"
          aria-labelledby={`root-cause-${incident.id}`}
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${activeSection === "causes" ? "review-mobile-active" : ""}`}
        >
          <SectionLabel index="02" title="Root cause exploration" />
          <h3 id={`root-cause-${incident.id}`} className="sr-only">Root cause relationships</h3>
          <RootCauseExplorer nodes={incident.root_cause_tree} />
        </section>

        <section
          data-review-section="architecture"
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${activeSection === "architecture" ? "review-mobile-active" : ""}`}
        >
          <SectionLabel index="03" title="Architecture change" />
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">
            {incident.architecture_diff.isFact ? "Documented facts" : "Reconstructed"}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2 md:gap-8">
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">Before</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{incident.architecture_diff.beforeFix}</p>
            </div>
            <div className="md:border-l md:border-slate-800 md:pl-7">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">After</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{incident.architecture_diff.afterFix}</p>
            </div>
          </div>
          {incident.architecture_diff.notes && (
            <p className="mt-4 border-l border-slate-700 pl-3 text-sm leading-6 text-slate-500">{incident.architecture_diff.notes}</p>
          )}
        </section>

        <section
          data-review-section="prevention"
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${activeSection === "prevention" ? "review-mobile-active" : ""}`}
        >
          <SectionLabel index="04" title="Prevention actions" />
          {incident.prevention_actions.length ? (
            <ol className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {incident.prevention_actions.map((action, index) => (
                <li key={`${incident.id}-prevention-${index}`} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-[#c6e47c]">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{action.title}</h4>
                    {action.description && <p className="mt-1 text-sm leading-6 text-slate-400">{action.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-sm text-slate-500">No prevention actions were submitted.</p>}
          {incident.official_post_mortem_url && (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <a href={incident.official_post_mortem_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-slate-400 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none">
                Open official post-mortem <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>

      </div>
      <IncidentReviewActions
        incidentId={incident.id}
        onReviewed={onReviewed}
        onRefresh={onRefresh}
      />
    </>
  );
}

export default function IncidentReviewQueue({ incidents }: { incidents: ReviewIncident[] }) {
  const router = useRouter();
  const [processedIncidentIds, setProcessedIncidentIds] = useState<string[]>([]);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(incidents[0]?.id ?? null);
  const [activeSection, setActiveSection] = useState<ReviewSectionId>("timeline");
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState(false);
  const mobileQueueRef = useRef<HTMLDivElement>(null);
  const mobileQueueDialogRef = useRef<HTMLDivElement>(null);
  const mobileQueueButtonRef = useRef<HTMLButtonElement>(null);
  const pendingIncidents = incidents.filter((incident) => !processedIncidentIds.includes(incident.id));
  const selectedIncident = pendingIncidents.find((incident) => incident.id === selectedIncidentId) ?? pendingIncidents[0] ?? null;

  useEffect(() => {
    if (!isMobileQueueOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileQueueDialogRef.current?.focus();

    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileQueueOpen(false);
        return;
      }
      if (event.key === "Tab") {
        const focusable = mobileQueueDialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
    };
  }, [isMobileQueueOpen]);

  useEffect(() => {
    if (!isMobileQueueOpen) mobileQueueButtonRef.current?.focus();
  }, [isMobileQueueOpen]);

  function handleReviewed(incidentId: string, message: string) {
    const nextIncident = pendingIncidents.find((incident) => incident.id !== incidentId);
    setProcessedIncidentIds((current) => [...current, incidentId]);
    setSelectedIncidentId(nextIncident?.id ?? null);
    setQueueNotice(message);
    router.refresh();
  }

  if (pendingIncidents.length === 0) {
    return (
      <section aria-label="Incidents awaiting review">
        {queueNotice && <p role="status" className="mb-5 border-l-2 border-[#c6e47c] bg-[#c6e47c]/[0.06] px-4 py-3 text-sm text-[#dcebb5]">{queueNotice}</p>}
        <div className="border-y border-dashed border-slate-700/80 py-12 text-center sm:py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#c6e47c]">Queue clear</p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">No reports awaiting review</h2>
          <p className="mt-2 text-sm text-slate-500">New submissions will appear here in arrival order.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Incidents awaiting review">
      {queueNotice && <p role="status" className="mb-5 border-l-2 border-[#c6e47c] bg-[#c6e47c]/[0.06] px-4 py-3 text-sm text-[#dcebb5]">{queueNotice}</p>}
      <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(15rem,0.31fr)_minmax(0,1fr)] lg:gap-9">
        <nav aria-label="Pending incident reports" className="relative z-20 hidden min-w-0 lg:sticky lg:top-6 lg:block lg:self-start">
          <div className="flex items-end justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">Intake ledger</p>
              <h2 className="mt-1 text-lg font-normal text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">Pending reports</h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-[#c6e47c]">{String(pendingIncidents.length).padStart(2, "0")}</span>
          </div>
          <ol className="hidden divide-y divide-slate-800/70 lg:block">
            {pendingIncidents.map((incident, index) => {
              const isSelected = incident.id === selectedIncident?.id;
              return (
                <li key={incident.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedIncidentId(incident.id); setActiveSection("timeline"); }}
                    className={`group relative block min-h-24 w-full py-4 pl-4 pr-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] ${isSelected ? "bg-white/[0.035]" : "hover:bg-white/[0.02]"}`}
                  >
                    <span aria-hidden="true" className={`absolute bottom-4 left-0 top-4 w-px ${isSelected ? "bg-[#c6e47c]" : "bg-transparent group-hover:bg-slate-600"}`} />
                    <span className="flex items-center justify-between gap-3">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${severityStyles[incident.severity] ?? "text-slate-400"}`}>{incident.severity}</span>
                      <span className="font-mono text-[9px] tabular-nums text-slate-600">{String(index + 1).padStart(2, "0")}</span>
                    </span>
                    <span className={`mt-2 block break-words text-sm leading-5 ${isSelected ? "text-[#f1f1e9]" : "text-slate-300 group-hover:text-slate-100"}`}>{incident.title}</span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">{incident.company_name} / {incident.system}</span>
                    <span className="mt-2 block text-[10px] text-slate-600">{formatDate(incident.created_at)} UTC</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[10px] leading-5 text-slate-600">Oldest submissions appear first. Selecting a report opens its submitted evidence.</p>
        </nav>

        {selectedIncident && (
          <div className="review-workspace-detail min-w-0 border-y border-slate-800/80 bg-[#080d16]/75">
            <div className="review-mobile-toolbar sticky top-0 z-30 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 border-b border-slate-800 bg-[#080d16] p-3 lg:hidden">
              <button
                ref={mobileQueueButtonRef}
                type="button"
                aria-expanded={isMobileQueueOpen}
                aria-controls="mobile-review-queue-dialog"
                onClick={() => setIsMobileQueueOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-700 px-3 text-xs font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                <List aria-hidden="true" className="h-4 w-4 text-[#c6e47c]" />
                Queue <span className="font-mono tabular-nums text-slate-500">{String(pendingIncidents.length).padStart(2, "0")}</span>
              </button>
              <label className="flex min-w-0 items-center gap-2 border border-slate-800 px-2.5">
                <span className="sr-only">Review section</span>
                <select value={activeSection} onChange={(event) => setActiveSection(event.target.value as ReviewSectionId)} className="min-h-11 w-full min-w-0 appearance-none bg-transparent text-xs text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c]">
                  <option value="timeline">01 · Timeline</option>
                  <option value="causes">02 · Root cause</option>
                  <option value="architecture">03 · Architecture</option>
                  <option value="prevention">04 · Prevention</option>
                </select>
                <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </label>
            </div>
            <IncidentInvestigation
              key={selectedIncident.id}
              incident={selectedIncident}
              activeSection={activeSection}
              onReviewed={(message) => handleReviewed(selectedIncident.id, message)}
              onRefresh={() => router.refresh()}
            />
          </div>
        )}
      </div>

      <div
        id="mobile-review-queue-dialog"
        ref={mobileQueueDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-review-queue-title"
        tabIndex={-1}
        hidden={!isMobileQueueOpen}
        className="review-queue-sheet fixed inset-0 z-[60] flex items-end bg-black/70 p-0 outline-none lg:hidden"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMobileQueueOpen(false); }}
      >
        <div className="max-h-[88dvh] w-full min-w-0 overflow-hidden border-t border-slate-700 bg-[#0b111b] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-4">
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Intake ledger · {pendingIncidents.length} pending</p>
              <h2 id="mobile-review-queue-title" className="mt-1 text-lg text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">Choose a report</h2>
            </div>
            <button type="button" onClick={() => setIsMobileQueueOpen(false)} aria-label="Close report queue" className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-slate-700 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"><X aria-hidden="true" className="h-4 w-4" /></button>
          </div>
          <ol className="max-h-[calc(88dvh-5rem)] overflow-y-auto overscroll-contain divide-y divide-slate-800/80">
            {pendingIncidents.map((incident, index) => {
              const isSelected = incident.id === selectedIncident?.id;
              return (
                <li key={incident.id}>
                  <button type="button" aria-pressed={isSelected} onClick={() => { setSelectedIncidentId(incident.id); setActiveSection("timeline"); setIsMobileQueueOpen(false); }} className={`block min-h-20 w-full min-w-0 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] ${isSelected ? "bg-[#c6e47c]/[0.06]" : "hover:bg-white/[0.03]"}`}>
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${severityStyles[incident.severity] ?? "text-slate-400"}`}>{String(index + 1).padStart(2, "0")} / {incident.severity}</span>
                      <time dateTime={incident.created_at} className="shrink-0 text-[9px] text-slate-500">{formatDate(incident.created_at)} UTC</time>
                    </span>
                    <span className="mt-1 block break-words text-sm leading-5 text-slate-100">{incident.title}</span>
                    <span className="mt-1 block break-words text-[11px] leading-4 text-slate-500">{incident.company_name} / {incident.system}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function IncidentReviewActions({ incidentId, onReviewed, onRefresh }: { incidentId: string; onReviewed: (message: string) => void; onRefresh: () => void }) {
  const [reason, setReason] = useState("");
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function submitDecision(action: "APPROVED" | "CHANGES_REQUESTED", event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmedReason = reason.trim();
    if (action === "CHANGES_REQUESTED" && !trimmedReason) {
      setFeedback({ kind: "error", message: "Enter a reason before requesting changes." });
      return;
    }
    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await reviewIncident(action === "APPROVED" ? { incidentId, action } : { incidentId, action, reason: trimmedReason });
      if (result.error) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      onReviewed(action === "APPROVED" ? "Incident approved and published." : "Changes requested. The reason has been recorded.");
    } catch {
      setFeedback({ kind: "error", message: "Unable to save the decision. Please refresh and try again." });
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="review-decision-enter border-t border-slate-800/80 bg-black/[0.12] px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="review-decision-copy max-w-xl">
          <SectionLabel index="05" title="Review decision" />
          <p className="mt-2 text-xs leading-5 text-slate-500">Publish this report to the archive, or return it to the author with a specific reason for revision.</p>
        </div>
        <div className="review-decision-buttons flex flex-wrap gap-2">
          <button type="button" disabled={isSubmitting} onClick={() => submitDecision("APPROVED")} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 bg-[#c6e47c] px-4 text-sm font-semibold text-[#11150a] transition-colors hover:bg-[#d5ee96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
            {isSubmitting ? "Saving…" : "Approve & publish"}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
          <button type="button" disabled={isSubmitting} aria-expanded={isChangeRequestOpen} aria-controls={`change-request-${incidentId}`} onClick={() => { setFeedback(null); setIsChangeRequestOpen((open) => !open); }} className="inline-flex min-h-11 items-center border border-slate-700 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-amber-300/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
            {isChangeRequestOpen ? "Cancel request" : "Request changes"}
          </button>
        </div>
      </div>

      {isChangeRequestOpen && (
        <form id={`change-request-${incidentId}`} onSubmit={(event) => submitDecision("CHANGES_REQUESTED", event)} className="mt-5 max-w-2xl border-l-2 border-amber-300/60 pl-4 sm:pl-5">
          <label htmlFor={`review-reason-${incidentId}`} className="block text-sm font-medium text-slate-200">Reason for requested changes</label>
          <p id={`review-reason-help-${incidentId}`} className="mt-1 text-xs text-slate-500">Explain what needs clarification or revision. A reason is required.</p>
          <textarea id={`review-reason-${incidentId}`} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} disabled={isSubmitting} aria-describedby={`review-reason-help-${incidentId}`} autoFocus className="mt-3 block w-full resize-y border border-slate-700 bg-[#080d16] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-60" placeholder="Write a clear, actionable reason." />
          <button type="submit" disabled={isSubmitting} className="mt-3 inline-flex min-h-10 items-center border border-amber-300/50 px-4 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">{isSubmitting ? "Sending…" : "Send change request"}</button>
        </form>
      )}

      {feedback && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p role={feedback.kind === "error" ? "alert" : "status"} className={`text-sm ${feedback.kind === "error" ? "text-rose-300" : "text-[#c6e47c]"}`}>{feedback.message}</p>
          {feedback.kind === "error" && <button type="button" onClick={onRefresh} className="inline-flex min-h-9 items-center gap-2 text-xs text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"><RefreshCw aria-hidden="true" className="h-3 w-3" />Refresh queue</button>}
        </div>
      )}
    </section>
  );
}
