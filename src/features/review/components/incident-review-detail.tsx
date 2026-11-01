/** @format */

"use client";

import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Cpu,
  GitBranch,
  RefreshCw,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ArchitectureDiffDiagram } from "./architecture-diff-diagram";
import { IncidentFactsBar } from "./incident-facts-bar";
import { IncidentTimeline } from "./incident-timeline";
import { PreventionList } from "./prevention-list";
import { ProgressRing } from "./progress-ring";
import { RootCauseDiagram } from "./root-cause-diagram";
import { SectionHeading } from "./section-heading";
import { formatDate, severityMeta } from "./visualization-shared";
import { getSafeHttpsUrl } from "@/features/incidents/schema";
import type { ReviewIncident } from "@/features/review/server/queries";
import { reviewIncident } from "@/features/review/server/actions";

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

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
      <span className="text-[#c6e47c]">{index}</span>
      {title}
    </h3>
  );
}

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

function IncidentReviewDecision({
  id,
  incident,
  nextIncidentId,
}: {
  id: string;
  incident: ReviewIncident;
  nextIncidentId: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [queueCompleted, setQueueCompleted] = useState(false);

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
          ? { incidentId: incident.id, action }
          : { incidentId: incident.id, action, reason: trimmedReason },
      );
      if (result.error) {
        // Failed decision: remain on this incident and surface the error.
        setFeedback({ kind: "error", message: result.error });
        return;
      }

      // Successful decision: advance automatically.
      if (nextIncidentId) {
        // Navigate to the next pending incident in queue order. The server
        // re-fetches the queue on that page, so the advanced-to incident is
        // guaranteed to still be pending.
        router.push(`/review/incidents/${nextIncidentId}`);
      } else {
        // No next incident: show the queue-completed state inline.
        setQueueCompleted(true);
        setFeedback({
          kind: "success",
          message:
            action === "APPROVED"
              ? "Incident approved and published. The review queue is clear."
              : "Changes requested. The review queue is clear.",
        });
      }
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

  if (queueCompleted) {
    return (
      <section
        id={id}
        className="review-decision-enter border-t border-slate-800/80 bg-black/[0.12] px-5 py-8 sm:px-7 sm:py-10"
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#c6e47c]">
            Queue clear
          </p>
          <h3 className="mt-3 text-2xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
            No reports awaiting review
          </h3>
          {feedback && (
            <p role="status" className="mt-3 text-sm text-[#c6e47c]">
              {feedback.message}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-500">
            New submissions will appear here in arrival order.
          </p>
          <LinkBackToQueue />
        </div>
      </section>
    );
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
            {nextIncidentId
              ? " Your decision moves you to the next report in the queue."
              : " This is the last report in the queue."}
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
            aria-controls={`change-request-${incident.id}`}
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
          id={`change-request-${incident.id}`}
          onSubmit={(event) => submitDecision("CHANGES_REQUESTED", event)}
          className="review-change-form mt-5 max-w-2xl border-l-2 border-amber-300/60 pl-4 sm:pl-5"
        >
          <label
            htmlFor={`review-reason-${incident.id}`}
            className="block text-sm font-medium text-slate-200"
          >
            Reason for requested changes
          </label>
          <p
            id={`review-reason-help-${incident.id}`}
            className="mt-1 text-xs text-slate-500"
          >
            Explain what needs clarification or revision. A reason is required.
          </p>
          <textarea
            id={`review-reason-${incident.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            disabled={isSubmitting}
            aria-describedby={`review-reason-help-${incident.id}`}
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
              onClick={() => router.refresh()}
              className="inline-flex min-h-9 items-center gap-2 text-xs text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function LinkBackToQueue() {
  return (
    <Link
      href="/review/incidents"
      className="mt-5 inline-flex min-h-11 items-center gap-2 bg-[#c6e47c] px-5 text-sm font-semibold text-[#11150a] transition-colors hover:bg-[#d5ee96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
    >
      Return to review queue
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}
