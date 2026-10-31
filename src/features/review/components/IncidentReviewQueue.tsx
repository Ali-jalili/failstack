/** @format */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Cpu,
  GitBranch,
  List,
  RefreshCw,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { reviewIncident } from "@/features/review/server/actions";
import { ArchitectureDiffDiagram } from "@/features/review/components/architecture-diff-diagram";
import { IncidentFactsBar } from "@/features/review/components/incident-facts-bar";
import { IncidentTimeline } from "@/features/review/components/incident-timeline";
import { PreventionList } from "@/features/review/components/prevention-list";
import { ProgressRing } from "@/features/review/components/progress-ring";
import { RootCauseDiagram } from "@/features/review/components/root-cause-diagram";
import { SectionHeading } from "@/features/review/components/section-heading";
import {
  formatDate,
  severityMeta,
} from "@/features/review/components/visualization-shared";
import type { ReviewIncident } from "@/features/review/server/queries";

type ReviewSectionId = "timeline" | "causes" | "architecture" | "prevention";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
      <span className="text-[#c6e47c]">{index}</span>
      {title}
    </h3>
  );
}

function IncidentInvestigation({
  incident,
  activeSection,
  onSectionChange,
  onReviewed,
  onRefresh,
}: {
  incident: ReviewIncident;
  activeSection: ReviewSectionId;
  onSectionChange: (section: ReviewSectionId) => void;
  onReviewed: (message: string) => void;
  onRefresh: () => void;
}) {
  const sev = severityMeta[incident.severity];
  const sectionCount = [
    incident.timeline.length > 0,
    incident.root_cause_tree.length > 0,
    incident.architecture_diff.beforeFix.length > 0,
    incident.prevention_actions.length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* ---- header ---- */}
      <header className="review-panel-enter border-b border-slate-800/80 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-sm border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${sev.bg} ${sev.text}`}
          >
            {sev.label}
          </span>
          <span className="h-1 w-1 rotate-45 bg-slate-600" aria-hidden />
          <span className="rounded-sm border border-[#c6e47c]/25 bg-[#c6e47c]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c6e47c]">
            Awaiting review
          </span>
          <time
            dateTime={incident.created_at}
            className="ml-auto text-[11px] text-slate-500"
          >
            Submitted {formatDate(incident.created_at)} UTC
          </time>
        </div>

        <h2 className="mt-4 break-words text-[clamp(1.5rem,2.6vw,2.2rem)] font-medium leading-tight tracking-tight text-slate-100">
          {incident.title}
        </h2>
        <p className="mt-1.5 break-words text-sm text-slate-400">
          <span className="text-slate-200">{incident.company_name}</span>
          <span className="mx-1.5 text-slate-600">/</span>
          {incident.system}
        </p>

        {/* Reviewer-only submitter identity, surfaced before the incident summary. */}
        {incident.author_name || incident.author_email ? (
          <div className="mt-5 flex max-w-xl items-center gap-3 border border-[#c6e47c]/20 bg-[#c6e47c]/[0.045] px-3.5 py-3 sm:px-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c6e47c]/25 bg-[#c6e47c]/[0.08] text-[#c6e47c]">
              <UserRound aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#c6e47c]">
                Submitted by
              </p>
              {incident.author_name ? (
                <p className="mt-0.5 break-words text-sm font-medium text-slate-100">
                  {incident.author_name}
                </p>
              ) : null}
              {incident.author_email ? (
                <p className="mt-0.5 break-all text-xs text-slate-400">
                  {incident.author_email}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-4 max-w-3xl break-words whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {incident.summary}
        </p>

        <div className="mt-5">
          <IncidentFactsBar incident={incident} />
        </div>
      </header>

      {/* ---- section tabs (sticky on desktop) ---- */}
      <nav
        aria-label="Incident review sections"
        className="review-section-links hidden border-b border-slate-800/80 px-4 sm:px-6 lg:flex"
      >
        {(
          [
            ["timeline", "01", "Timeline"],
            ["causes", "02", "Root Cause"],
            ["architecture", "03", "Architecture"],
            ["prevention", "04", "Prevention"],
            ["decision", "05", "Decision"],
          ] as const
        ).map(([section, index, label]) => (
          <a
            key={section}
            href={
              section === "decision"
                ? `#review-decision-${incident.id}`
                : `#review-section-${section}-${incident.id}`
            }
            onClick={() => {
              if (section !== "decision") onSectionChange(section);
            }}
            aria-current={section === activeSection ? "location" : undefined}
            className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] motion-reduce:transition-none ${
              section === activeSection
                ? "border-[#c6e47c] text-[#d9f09b]"
                : "border-transparent text-slate-500 hover:text-slate-200"
            }`}
          >
            <span className="font-mono text-[9px] text-slate-600">{index}</span>
            {label}
          </a>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <ProgressRing
            value={sectionCount}
            total={4}
            size={40}
            label="Sections completed"
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">
            {sectionCount}/4
            <br />
            sections
          </span>
        </div>
      </nav>

      {/* ---- sections ---- */}
      <div
        id={`review-sections-${incident.id}`}
        className="review-investigation-sections px-4 py-5 sm:px-6 sm:py-6"
        data-active-section={activeSection}
      >
        {/* 01 · timeline */}
        <section
          id={`review-section-timeline-${incident.id}`}
          data-review-section="timeline"
          className={`review-mobile-section review-section-enter ${
            activeSection === "timeline" ? "review-mobile-active" : ""
          }`}
        >
          <SectionHeading
            icon={Clock}
            title="01 · Incident Timeline"
            subtitle={`${incident.timeline.length} events recorded`}
          />
          <IncidentTimeline events={incident.timeline} />
        </section>

        {/* 02 · root cause */}
        <section
          id={`review-section-causes-${incident.id}`}
          data-review-section="causes"
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${
            activeSection === "causes" ? "review-mobile-active" : ""
          }`}
        >
          <SectionHeading
            icon={GitBranch}
            title="02 · Root Cause Exploration"
            subtitle={`${incident.root_cause_tree.length} factors identified`}
          />
          <RootCauseDiagram nodes={incident.root_cause_tree} />
        </section>

        {/* 03 · architecture */}
        <section
          id={`review-section-architecture-${incident.id}`}
          data-review-section="architecture"
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${
            activeSection === "architecture" ? "review-mobile-active" : ""
          }`}
        >
          <SectionHeading
            icon={Cpu}
            title="03 · Architecture Change"
            subtitle={
              incident.architecture_diff.isFact
                ? "Documented facts"
                : "Reconstructed"
            }
          />
          <ArchitectureDiffDiagram incident={incident} />
        </section>

        {/* 04 · prevention */}
        <section
          id={`review-section-prevention-${incident.id}`}
          data-review-section="prevention"
          className={`review-mobile-section review-section-enter mt-8 border-t border-slate-800/80 pt-6 ${
            activeSection === "prevention" ? "review-mobile-active" : ""
          }`}
        >
          <SectionHeading
            icon={Shield}
            title="04 · Prevention Actions"
            subtitle={`${incident.prevention_actions.length} recommended`}
          />
          <PreventionList actions={incident.prevention_actions} />
          {incident.official_post_mortem_url && (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <a
                href={incident.official_post_mortem_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-slate-400 underline decoration-slate-700 underline-offset-4 transition-colors hover:text-[#c6e47c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
              >
                Open official post-mortem{" "}
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>
      </div>

      <IncidentReviewActions
        id={`review-decision-${incident.id}`}
        incidentId={incident.id}
        onReviewed={onReviewed}
        onRefresh={onRefresh}
      />
    </>
  );
}

export default function IncidentReviewQueue({
  incidents,
}: {
  incidents: ReviewIncident[];
}) {
  const router = useRouter();
  const [processedIncidentIds, setProcessedIncidentIds] = useState<string[]>(
    [],
  );
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents[0]?.id ?? null,
  );
  const [activeSection, setActiveSection] =
    useState<ReviewSectionId>("timeline");
  const [isMobileSectionMenuOpen, setIsMobileSectionMenuOpen] = useState(false);
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState(false);
  const mobileQueueDialogRef = useRef<HTMLDivElement>(null);
  const mobileQueueButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileQueueOpen = useRef(false);
  const pendingIncidents = incidents.filter(
    (incident) => !processedIncidentIds.includes(incident.id),
  );
  const selectedIncident =
    pendingIncidents.find((incident) => incident.id === selectedIncidentId) ??
    pendingIncidents[0] ??
    null;

  useEffect(() => {
    if (!isMobileQueueOpen) {
      if (wasMobileQueueOpen.current) mobileQueueButtonRef.current?.focus();
      wasMobileQueueOpen.current = false;
      return;
    }

    wasMobileQueueOpen.current = true;
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
        const focusable =
          mobileQueueDialogRef.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
          );
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

    function closeWhenDesktop(event: MediaQueryListEvent) {
      if (event.matches) setIsMobileQueueOpen(false);
    }

    document.addEventListener("keydown", handleDialogKeys);
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    desktopQuery.addEventListener("change", closeWhenDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
      desktopQuery.removeEventListener("change", closeWhenDesktop);
    };
  }, [isMobileQueueOpen]);

  function handleReviewed(incidentId: string, message: string) {
    const nextIncident = pendingIncidents.find(
      (incident) => incident.id !== incidentId,
    );
    setProcessedIncidentIds((current) => [...current, incidentId]);
    setSelectedIncidentId(nextIncident?.id ?? null);
    setActiveSection("timeline");
    setQueueNotice(message);
    router.refresh();
  }

  if (pendingIncidents.length === 0) {
    return (
      <section aria-label="Incidents awaiting review">
        {queueNotice && (
          <p
            role="status"
            className="mb-5 border-l-2 border-[#c6e47c] bg-[#c6e47c]/[0.06] px-4 py-3 text-sm text-[#dcebb5]"
          >
            {queueNotice}
          </p>
        )}
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
      {queueNotice && (
        <p
          role="status"
          className="mb-5 border-l-2 border-[#c6e47c] bg-[#c6e47c]/[0.06] px-4 py-3 text-sm text-[#dcebb5]"
        >
          {queueNotice}
        </p>
      )}
      <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(15rem,0.31fr)_minmax(0,1fr)] lg:gap-9">
        <nav
          aria-label="Pending incident reports"
          className="relative z-20 hidden min-w-0 lg:sticky lg:top-6 lg:block lg:self-start"
        >
          <div className="flex items-end justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
                Intake ledger
              </p>
              <h2 className="mt-1 text-lg font-normal text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
                Pending reports
              </h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-[#c6e47c]">
              {String(pendingIncidents.length).padStart(2, "0")}
            </span>
          </div>
          <ol className="hidden max-h-[min(58dvh,34rem)] divide-y divide-slate-800/70 overflow-y-auto overscroll-contain lg:block">
            {pendingIncidents.map((incident, index) => {
              const isSelected = incident.id === selectedIncident?.id;
              return (
                <li key={incident.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                      setActiveSection("timeline");
                    }}
                    className={`group relative block min-h-24 w-full py-4 pl-4 pr-2 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] ${isSelected ? "bg-white/[0.035]" : "hover:bg-white/[0.02]"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-4 left-0 top-4 w-px ${isSelected ? "bg-[#c6e47c]" : "bg-transparent group-hover:bg-slate-600"}`}
                    />
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.1em] ${severityMeta[incident.severity]?.text ?? "text-slate-400"}`}
                      >
                        {incident.severity}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-slate-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </span>
                    <span
                      className={`mt-2 block break-words text-sm leading-5 ${isSelected ? "text-[#f1f1e9]" : "text-slate-300 group-hover:text-slate-100"}`}
                    >
                      {incident.title}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">
                      {incident.company_name} / {incident.system}
                    </span>
                    <span className="mt-2 block text-[10px] text-slate-600">
                      {formatDate(incident.created_at)} UTC
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[10px] leading-5 text-slate-600">
            Oldest submissions appear first. Selecting a report opens its
            submitted evidence.
          </p>
        </nav>

        {selectedIncident && (
          <div className="review-workspace-detail min-w-0 border-y border-slate-800/80 bg-[#080d16]/75">
            <div className="review-mobile-toolbar sticky top-0 z-30 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-2 border-b border-slate-800 bg-[#080d16] p-3 lg:hidden">
              <button
                ref={mobileQueueButtonRef}
                type="button"
                aria-expanded={isMobileQueueOpen}
                aria-controls={
                  isMobileQueueOpen ? "mobile-review-queue-dialog" : undefined
                }
                onClick={() => setIsMobileQueueOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-700 px-3 text-xs font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                <List aria-hidden="true" className="h-4 w-4 text-[#c6e47c]" />
                Queue{" "}
                <span className="font-mono tabular-nums text-slate-500">
                  {String(pendingIncidents.length).padStart(2, "0")}
                </span>
              </button>
              <div
                className="review-section-picker relative min-w-0"
                onBlur={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    setIsMobileSectionMenuOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsMobileSectionMenuOpen(false);
                }}
              >
                <button
                  type="button"
                  aria-label="Choose review section"
                  aria-haspopup="listbox"
                  aria-expanded={isMobileSectionMenuOpen}
                  aria-controls="review-section-options"
                  onClick={() => setIsMobileSectionMenuOpen((open) => !open)}
                  className="review-section-picker-trigger flex min-h-11 w-full min-w-0 items-center justify-between gap-2 px-3 text-left text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c]"
                >
                  <span className="truncate">
                    {activeSection === "timeline" && "01 · Timeline"}
                    {activeSection === "causes" && "02 · Root cause"}
                    {activeSection === "architecture" && "03 · Architecture"}
                    {activeSection === "prevention" && "04 · Prevention"}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 shrink-0 text-[#c6e47c] transition-transform duration-200 ${isMobileSectionMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isMobileSectionMenuOpen && (
                  <div
                    id="review-section-options"
                    role="listbox"
                    aria-label="Review sections"
                    className="review-section-picker-menu absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden"
                  >
                    {(
                      [
                        ["timeline", "01", "Timeline"],
                        ["causes", "02", "Root cause"],
                        ["architecture", "03", "Architecture"],
                        ["prevention", "04", "Prevention"],
                      ] as const
                    ).map(([section, number, label]) => (
                      <button
                        key={section}
                        type="button"
                        role="option"
                        aria-selected={activeSection === section}
                        onClick={() => {
                          setActiveSection(section);
                          setIsMobileSectionMenuOpen(false);
                        }}
                        className={`review-section-picker-option flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-xs transition-colors ${activeSection === section ? "is-selected" : ""}`}
                      >
                        <span className="font-mono text-[10px] text-slate-500">
                          {number}
                        </span>
                        <span>{label}</span>
                        {activeSection === section && (
                          <span
                            aria-hidden="true"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c6e47c] shadow-[0_0_8px_#c6e47c]"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <IncidentInvestigation
              key={selectedIncident.id}
              incident={selectedIncident}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onReviewed={(message) =>
                handleReviewed(selectedIncident.id, message)
              }
              onRefresh={() => router.refresh()}
            />
          </div>
        )}
      </div>

      {isMobileQueueOpen && (
        <div
          id="mobile-review-queue-dialog"
          ref={mobileQueueDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-review-queue-title"
          tabIndex={-1}
          className="review-queue-sheet fixed inset-0 z-[60] flex items-end bg-black/70 p-0 outline-none lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget)
              setIsMobileQueueOpen(false);
          }}
        >
          <div className="max-h-[88dvh] w-full min-w-0 overflow-hidden border-t border-slate-700 bg-[#0b111b] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  Intake ledger · {pendingIncidents.length} pending
                </p>
                <h2
                  id="mobile-review-queue-title"
                  className="mt-1 text-lg text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]"
                >
                  Choose a report
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileQueueOpen(false)}
                aria-label="Close report queue"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-slate-700 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <ol className="max-h-[calc(88dvh-5rem)] overflow-y-auto overscroll-contain divide-y divide-slate-800/80">
              {pendingIncidents.map((incident, index) => {
                const isSelected = incident.id === selectedIncident?.id;
                return (
                  <li key={incident.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedIncidentId(incident.id);
                        setActiveSection("timeline");
                        setIsMobileQueueOpen(false);
                      }}
                      className={`block min-h-20 w-full min-w-0 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6e47c] ${isSelected ? "bg-[#c6e47c]/[0.06]" : "hover:bg-white/[0.03]"}`}
                    >
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.1em] ${severityMeta[incident.severity]?.text ?? "text-slate-400"}`}
                        >
                          {String(index + 1).padStart(2, "0")} /{" "}
                          {incident.severity}
                        </span>
                        <time
                          dateTime={incident.created_at}
                          className="shrink-0 text-[9px] text-slate-500"
                        >
                          {formatDate(incident.created_at)} UTC
                        </time>
                      </span>
                      <span className="mt-1 block break-words text-sm leading-5 text-slate-100">
                        {incident.title}
                      </span>
                      <span className="mt-1 block break-words text-[11px] leading-4 text-slate-500">
                        {incident.company_name} / {incident.system}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function IncidentReviewActions({
  id,
  incidentId,
  onReviewed,
  onRefresh,
}: {
  id: string;
  incidentId: string;
  onReviewed: (message: string) => void;
  onRefresh: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  async function submitDecision(
    action: "APPROVED" | "CHANGES_REQUESTED",
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();
    const trimmedReason = reason.trim();
    if (action === "CHANGES_REQUESTED" && !trimmedReason) {
      setFeedback({
        kind: "error",
        message: "Enter a reason before requesting changes.",
      });
      return;
    }
    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await reviewIncident(
        action === "APPROVED"
          ? { incidentId, action }
          : { incidentId, action, reason: trimmedReason },
      );
      if (result.error) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      onReviewed(
        action === "APPROVED"
          ? "Incident approved and published."
          : "Changes requested. The reason has been recorded.",
      );
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to save the decision. Please refresh and try again.",
      });
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id={id}
      className="review-decision-enter border-t border-slate-800/80 bg-black/[0.12] px-5 py-5 sm:px-7 sm:py-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="review-decision-copy max-w-xl">
          <SectionLabel index="05" title="Review decision" />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Publish this report to the archive, or return it to the author with
            a specific reason for revision.
          </p>
        </div>
        <div className="review-decision-buttons flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => submitDecision("APPROVED")}
            className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 bg-[#c6e47c] px-4 text-sm font-semibold text-[#11150a] transition-colors hover:bg-[#d5ee96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isSubmitting ? "Saving…" : "Approve & publish"}
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            aria-expanded={isChangeRequestOpen}
            aria-controls={`change-request-${incidentId}`}
            onClick={() => {
              setFeedback(null);
              setIsChangeRequestOpen((open) => !open);
            }}
            className="inline-flex min-h-11 items-center border border-slate-700 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-amber-300/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isChangeRequestOpen ? "Cancel request" : "Request changes"}
          </button>
        </div>
      </div>

      {isChangeRequestOpen && (
        <form
          id={`change-request-${incidentId}`}
          onSubmit={(event) => submitDecision("CHANGES_REQUESTED", event)}
          className="review-change-form mt-5 max-w-2xl border-l-2 border-amber-300/60 pl-4 sm:pl-5"
        >
          <label
            htmlFor={`review-reason-${incidentId}`}
            className="block text-sm font-medium text-slate-200"
          >
            Reason for requested changes
          </label>
          <p
            id={`review-reason-help-${incidentId}`}
            className="mt-1 text-xs text-slate-500"
          >
            Explain what needs clarification or revision. A reason is required.
          </p>
          <textarea
            id={`review-reason-${incidentId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            disabled={isSubmitting}
            aria-describedby={`review-reason-help-${incidentId}`}
            autoFocus
            className="mt-3 block w-full resize-y border border-slate-700 bg-[#080d16] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-60"
            placeholder="Write a clear, actionable reason."
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 inline-flex min-h-10 items-center border border-amber-300/50 px-4 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-300/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
          >
            {isSubmitting ? "Sending…" : "Send change request"}
          </button>
        </form>
      )}

      {feedback && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p
            role={feedback.kind === "error" ? "alert" : "status"}
            className={`text-sm ${feedback.kind === "error" ? "text-rose-300" : "text-[#c6e47c]"}`}
          >
            {feedback.message}
          </p>
          {feedback.kind === "error" && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex min-h-9 items-center gap-2 text-xs text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
            >
              <RefreshCw aria-hidden="true" className="h-3 w-3" />
              Refresh queue
            </button>
          )}
        </div>
      )}
    </section>
  );
}
