/** @format */

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { IncidentStatus } from "@/types/incident";
import type { MyReport } from "@/features/incidents/server/queries";

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

const lifecycleStages = [
  "Submitted",
  "Under review",
  "Decision",
  "Published",
];

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
        A record of the incidents you have contributed and where each one stands.
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
        {summaryStatuses.map((status) => {
          const details = statusDetails[status];
          const count = reports.filter((report) => report.status === status).length;

          return (
            <div
              key={status}
              className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
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
          <li key={stage} className="min-w-0 border-t border-slate-700/80 pt-2.5">
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

function ReportStatus({ report }: { report: MyReport }) {
  const status = statusDetails[report.status];

  return (
    <div>
      <p className={`flex items-center gap-2 text-xs font-medium ${status.color}`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-current" />
        {status.label}
      </p>
      <p className="mt-2 text-[11px] leading-[1.65] text-slate-500">
        {status.description}
      </p>

      {report.status === "CHANGES_REQUESTED" && (
        <div className="mt-3 border-l border-[#e2a16d]/50 pl-3">
          {report.latest_review_reason && (
            <>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#d79b75]">
                Reviewer feedback
              </p>
              <p className="mt-1.5 break-words text-xs leading-5 text-slate-300">
                {report.latest_review_reason}
              </p>
            </>
          )}
          <Link
            href={`/incidents/${report.id}/edit`}
            className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#e2a16d] underline decoration-[#e2a16d]/30 underline-offset-4 transition-colors hover:text-[#f0b88f] hover:decoration-[#f0b88f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2a16d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
          >
            Edit report
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ReportHistory({ reports }: { reports: MyReport[] }) {
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
          {sortedReports.length} {sortedReports.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <ol className="relative border-t border-slate-800/80 before:absolute before:bottom-0 before:left-[3px] before:top-0 before:w-px before:bg-slate-800/80">
        {sortedReports.map((report) => (
          <li
            key={report.id}
            className="relative grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-3 border-b border-slate-800/80 py-5 pl-6 sm:grid-cols-[8.5rem_minmax(0,1fr)_12rem] sm:gap-x-5 sm:py-6"
          >
            <span
              aria-hidden="true"
              className="absolute left-0 top-[1.8rem] h-[7px] w-[7px] border border-[#c6e47c] bg-[#080d16]"
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
              <ReportStatus report={report} />
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

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(13rem,0.72fr)_minmax(0,1.7fr)] lg:gap-14 xl:gap-20">
      <EditorialSidebar count={contributionCount} />

      <div className="min-w-0">
        {error ? (
          <div
            role="alert"
            className="border-y border-rose-500/30 bg-rose-500/[0.06] px-4 py-5 text-sm text-rose-200 sm:px-5"
          >
            <p className="font-semibold">Unable to load your reports.</p>
            <p className="mt-2 break-words text-rose-200/80">{error}</p>
          </div>
        ) : reports === null ? (
          <p role="status" aria-live="polite" className="py-6 text-sm text-slate-400">
            Loading your reports...
          </p>
        ) : (
          <>
            <StatusOverview reports={reports} />
            <SubmissionJourney />
            <ReportHistory reports={reports} />
          </>
        )}
      </div>
    </div>
  );
}
