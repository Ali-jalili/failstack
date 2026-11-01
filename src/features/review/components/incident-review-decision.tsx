/** @format */

"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { ReviewIncident } from "@/features/review/server/queries";
import { reviewIncident } from "@/features/review/server/actions";

export default function IncidentReviewDecision({
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

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <h3 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
      <span className="text-[#c6e47c]">{index}</span>
      {title}
    </h3>
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
