/** @format */

import Link from "next/link";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { IncidentStatus } from "@/types/incident";
import type { MyReport } from "@/features/incidents/server/queries";
import { deleteIncident } from "@/features/incidents/server/actions";
import {
  successToastOptions,
  errorToastOptions,
} from "@/features/auth/components/auth-toast";

const statusDetails: Record<
  IncidentStatus,
  { label: string; color: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-400",
    description: "This report has not been submitted for review.",
  },
  PENDING_REVIEW: {
    label: "Awaiting review",
    color: "text-sky-300",
    description: "Your report is in the review queue. No action is needed now.",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    color: "text-[#e2a16d]",
    description: "Review the feedback and update your report to resubmit it.",
  },
  PUBLISHED: {
    label: "Published",
    color: "text-[#b6cf98]",
    description: "This report is included in the public incident archive.",
  },
};

const summaryStatuses: IncidentStatus[] = [
  "PENDING_REVIEW",
  "PUBLISHED",
  "CHANGES_REQUESTED",
];

const lifecycleStages = ["Submitted", "Under review", "Decision", "Published"];

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function EditorialSidebar({ count }: { count: number | null }) {
  return (
    <aside className="casebook-intro lg:sticky lg:top-28">
      <p className="home-kicker">
        <span aria-hidden="true" className="home-kicker-mark" />
        Author registry
      </p>
      <h1 className="mt-6 text-[clamp(2.5rem,5vw,3.7rem)] font-normal leading-[0.96] tracking-[-0.06em] text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif]">
        Incident <em className="text-[#c6e47c]">casebook.</em>
      </h1>
      <p className="mt-5 max-w-xs text-[13px] leading-[1.75] text-slate-400">
        A record of the incidents you have contributed and where each one
        stands.
      </p>

      <div className="mt-8 border-y border-slate-800/80 py-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
          Contributions
        </p>
        <p className="mt-1 font-mono text-2xl tabular-nums text-[#e8ece4]">
          {count ?? "n/a"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {count === null
            ? "count unavailable"
            : count === 1
              ? "incident report"
              : "incident reports"}
        </p>
      </div>
    </aside>
  );
}

function StatusOverview({ reports }: { reports: MyReport[] }) {
  return (
    <section aria-labelledby="status-overview-heading" className="mb-9">
      <h2
        id="status-overview-heading"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400"
      >
        Status overview
      </h2>
      <dl className="mt-3 grid grid-cols-1 border-y border-slate-800/80 sm:grid-cols-3">
        {summaryStatuses.map((status, index) => {
          const details = statusDetails[status];
          const count = reports.filter(
            (report) => report.status === status,
          ).length;

          return (
            <div
              key={status}
              style={{ animationDelay: `${100 + index * 55}ms` }}
              className="casebook-status flex items-center justify-between gap-4 border-b border-slate-800/70 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
            >
              <dt className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rotate-45 border border-current ${details.color}`}
                />
                {details.label}
              </dt>
              <dd className={`font-mono text-xl tabular-nums ${details.color}`}>
                {count}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function SubmissionJourney() {
  return (
    <section aria-labelledby="submission-journey-heading" className="mb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="submission-journey-heading"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400"
        >
          Submission journey
        </h2>
        <p className="text-[11px] text-slate-500">
          Each report moves through this workflow independently.
        </p>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
        {lifecycleStages.map((stage, index) => (
          <li
            key={stage}
            style={{ animationDelay: `${95 + index * 45}ms` }}
            className="casebook-journey-step min-w-0 pt-2.5"
          >
            <p className="font-mono text-[9px] tabular-nums tracking-[0.08em] text-slate-500">
              0{index + 1}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-300">{stage}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  incident,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: MyReport;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  async function handleDelete() {
    startTransition(async () => {
      const result = await deleteIncident(incident.id);
      if (result.error) {
        toast.error(result.error, errorToastOptions);
      } else {
        toast.success(`"${incident.title}" deleted.`, successToastOptions);
        onDelete();
      }
      onOpenChange(false);
    });
  }

  return (
    <dialog
      open={open}
      className="fixed inset-0 z-50 m-auto w-full max-w-sm rounded-lg border border-slate-700/60 bg-[#0c151c] p-6 shadow-2xl backdrop:bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10"
        >
          <Trash2 className="h-4 w-4 text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-rose-400">
            Delete incident
          </p>
          <p className="mt-1 break-words text-sm font-medium text-[#f1f1e9]">
            {incident.title}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            This action is permanent. The incident will be removed from your
            reports and from the public archive. This cannot be undone.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-700 px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-[#f1f1e9] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
        >
          {isPending ? (
            <>Deleting...</>
          ) : (
            <>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Delete permanently
            </>
          )}
        </button>
      </div>
    </dialog>
  );
}

function ReportStatus({
  report,
  onDeleted,
}: {
  report: MyReport;
  onDeleted: () => void;
}) {
  const status = statusDetails[report.status];
  const isEditable = report.status !== "PUBLISHED";
  const canDelete =
    report.status === "DRAFT" || report.status === "CHANGES_REQUESTED";
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div>
      <p
        className={`flex items-center gap-2 text-xs font-medium ${status.color}`}
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-current" />
        {status.label}
      </p>
      <p className="mt-2 text-[11px] leading-[1.65] text-slate-500">
        {status.description}
      </p>

      {isEditable && (
        <div className="mt-3 border-l border-[#e2a16d]/50 pl-3">
          {report.status === "CHANGES_REQUESTED" &&
          report.latest_review_reason ? (
            <>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#d79b75]">
                Reviewer feedback
              </p>
              <p className="mt-1.5 break-words text-xs leading-5 text-slate-300">
                {report.latest_review_reason}
              </p>
            </>
          ) : null}
          <Link
            href={`/incidents/${report.id}/edit`}
            className="group mt-2 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#e2a16d] underline decoration-[#e2a16d]/30 underline-offset-4 transition-colors hover:text-[#f0b88f] hover:decoration-[#f0b88f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2a16d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
          >
            Edit report
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
            />
          </Link>
        </div>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="group mt-2 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-rose-400 underline decoration-rose-400/30 underline-offset-4 transition-colors hover:text-rose-300 hover:decoration-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
        >
          <Trash2
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
          Delete report
        </button>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        incident={report}
        onDelete={onDeleted}
      />
    </div>
  );
}

function ReportHistory({
  reports,
  onDeleted,
}: {
  reports: MyReport[];
  onDeleted: (id: string) => void;
}) {
  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (sortedReports.length === 0) {
    return (
      <div className="border-y border-dashed border-slate-700/80 py-8">
        <h2 className="text-xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
          No reports in the registry
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Your submitted incidents and their review progress will appear here.
        </p>
        <Link
          href="/incidents/new"
          className="home-primary-action mt-5 inline-flex min-h-11 items-center gap-3 rounded-none px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Submit an incident
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="report-history-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2
          id="report-history-heading"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400"
        >
          Report history
        </h2>
        <p className="text-xs text-slate-500">
          {sortedReports.length}{" "}
          {sortedReports.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <ol className="casebook-history relative border-t border-slate-800/80 before:absolute before:bottom-0 before:left-[3px] before:top-0 before:w-px before:bg-slate-800/80">
        {sortedReports.map((report, index) => (
          <li
            key={report.id}
            className="casebook-row relative grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-3 border-b border-slate-800/80 py-5 pl-6 transition-colors duration-200 hover:bg-white/[0.025] focus-within:bg-white/[0.025] motion-reduce:transition-none sm:grid-cols-[8.5rem_minmax(0,1fr)_12rem] sm:gap-x-5 sm:py-6"
          >
            <span
              aria-hidden="true"
              style={{ animationDelay: `${120 + Math.min(index, 4) * 25}ms` }}
              className="casebook-marker absolute left-0 top-[1.8rem] h-[7px] w-[7px] border border-[#c6e47c] bg-[#080d16]"
            />
            <time
              dateTime={report.created_at}
              className="text-[11px] leading-5 text-slate-500 sm:pt-0.5"
            >
              {formatCreatedAt(report.created_at)}
            </time>

            <div className="min-w-0">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-600">
                Case {report.slug}
              </p>
              <h3 className="break-words text-base font-medium leading-6 text-[#e8ece4] sm:text-[17px]">
                {report.title}
              </h3>
            </div>

            <div className="min-w-0 sm:pt-0.5">
              <ReportStatus
                report={report}
                onDeleted={() => onDeleted(report.id)}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function MyReportsList({
  reports,
  error,
}: {
  reports: MyReport[] | null;
  error: string | null;
}) {
  const contributionCount = reports?.length ?? null;
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function handleDeleted(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  const visibleReports =
    reports && deletedIds.size > 0
      ? reports.filter((r) => !deletedIds.has(r.id))
      : reports;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(13rem,0.72fr)_minmax(0,1.7fr)] lg:gap-14 xl:gap-20">
      <EditorialSidebar count={visibleReports?.length ?? contributionCount} />

      <div className="casebook-main min-w-0">
        {error ? (
          <div
            role="alert"
            className="border-y border-rose-500/30 bg-rose-500/[0.06] px-4 py-5 text-sm text-rose-200 sm:px-5"
          >
            <p className="font-semibold">Unable to load your reports.</p>
            <p className="mt-2 break-words text-rose-200/80">{error}</p>
          </div>
        ) : visibleReports === null ||
          (visibleReports.length === 0 && reports === null) ? (
          <p
            role="status"
            aria-live="polite"
            className="py-6 text-sm text-slate-400"
          >
            Loading your reports...
          </p>
        ) : (
          <>
            <StatusOverview reports={visibleReports ?? []} />
            <SubmissionJourney />
            <ReportHistory
              reports={visibleReports ?? []}
              onDeleted={handleDeleted}
            />
          </>
        )}
      </div>
    </div>
  );
}
