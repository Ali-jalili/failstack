/** @format */

"use client";

import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  Cpu,
  GitBranch,
  Shield,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { ArchitectureDiffDiagram } from "./architecture-diff-diagram";
import IncidentReviewDecision from "./incident-review-decision";
import { IncidentFactsBar } from "./incident-facts-bar";
import { IncidentTimeline } from "./incident-timeline";
import { PreventionList } from "./prevention-list";
import { ProgressRing } from "./progress-ring";
import { RootCauseDiagram } from "./root-cause-diagram";
import { SectionHeading } from "./section-heading";
import { formatDate, severityMeta } from "./visualization-shared";
import { getSafeHttpsUrl } from "@/features/incidents/schema";
import type { ReviewIncident } from "@/features/review/server/queries";

/**
 * The full investigation view of one pending incident, with its evidence
 * sections and the decision panel. This is the body of the dedicated
 * `/review/incidents/[incidentId]` route (previously the inline detail pane
 * of the split-view queue).
 */
export function IncidentReviewDetail({
  incident,
  nextIncidentId,
  position,
  totalPending,
}: {
  incident: ReviewIncident;
  nextIncidentId: string | null;
  /** 1-based position of this incident within the pending queue. */
  position: number;
  /** Total number of pending incidents in the queue. */
  totalPending: number;
}) {
  return (
    <article className="review-incident-detail border-y border-slate-800/80 bg-[#080d16]/75">
      <IncidentInvestigation
        key={incident.id}
        incident={incident}
        nextIncidentId={nextIncidentId}
      />
      <ReviewPositionFooter position={position} total={totalPending} />
    </article>
  );
}

/**
 * Small footer strip under the investigation body showing where this report
 * sits in the pending queue. Kept intentionally minimal: Previous/Next are
 * provided by the route page (server-rendered links), this is only an
 * at-a-glance context marker.
 */
function ReviewPositionFooter({
  position,
  total,
}: {
  position: number;
  total: number | null;
}) {
  return (
    <p className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600 sm:px-6">
      Report {String(position).padStart(2, "0")}
      {total !== null
        ? ` of ${String(total).padStart(2, "0")} awaiting review`
        : " awaiting review"}
    </p>
  );
}
export type ReviewSectionId =
  | "timeline"
  | "causes"
  | "architecture"
  | "prevention";

/**
 * Renders one pending incident's full investigation (header, evidence
 * sections, and the decision panel). Extracted from the split-view queue so
 * the dedicated full-page detail route can reuse it without duplicating the
 * review-decision business logic.
 */
export function IncidentInvestigation({
  incident,
  nextIncidentId,
}: {
  incident: ReviewIncident;
  /** Id of the next pending incident in queue order, or null when this is the last. */
  nextIncidentId: string | null;
}) {
  const [activeSection, setActiveSection] =
    useState<ReviewSectionId>("timeline");
  const [isMobileSectionMenuOpen, setIsMobileSectionMenuOpen] = useState(false);
  const sev = severityMeta[incident.severity];
  const postMortemHref = incident.official_post_mortem_url
    ? getSafeHttpsUrl(incident.official_post_mortem_url)
    : null;
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
        className="review-section-links hidden border-b border-slate-800/80 px-4 sm:px-6 lg:sticky lg:top-16 lg:z-20 lg:flex lg:bg-[#080d16]"
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
            onClick={(event) => {
              event.preventDefault();
              if (section !== "decision") setActiveSection(section);

              const targetId =
                section === "decision"
                  ? `review-decision-${incident.id}`
                  : `review-section-${section}-${incident.id}`;
              const target = document.getElementById(targetId);

              if (target) {
                // The detail route uses normal document scrolling; scroll the
                // window instead of an inner pane.
                const stickyNavHeight =
                  event.currentTarget.closest("nav")?.clientHeight ?? 0;
                const top =
                  target.getBoundingClientRect().top +
                  window.scrollY -
                  stickyNavHeight -
                  4;
                window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
              }
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

      {/* ---- mobile section picker + toolbar ---- */}
      <div className="review-mobile-toolbar sticky top-0 z-30 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 border-b border-slate-800 bg-[#080d16] p-3 lg:hidden">
        <div
          className="review-section-picker relative min-w-0"
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
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
          {postMortemHref && (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <a
                href={postMortemHref}
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

      <IncidentReviewDecision
        id={`review-decision-${incident.id}`}
        incident={incident}
        nextIncidentId={nextIncidentId}
      />
    </>
  );
}
