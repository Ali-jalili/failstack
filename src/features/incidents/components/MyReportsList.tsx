/** @format */

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { IncidentStatus } from "@/types/incident";
import type { MyReport } from "@/features/incidents/server/queries";

const statusDetails: Record<
  IncidentStatus,
  { label: string; badge: string; description: string }
> = {
  DRAFT: {
    label: "Draft",
    badge: "border-slate-700 bg-slate-900/70 text-slate-400",
    description: "This report has not entered review.",
  },
  PENDING_REVIEW: {
    label: "Awaiting review",
    badge: "border-sky-400/25 bg-sky-400/5 text-sky-300",
    description: "Your report is in the review queue. No action is needed now.",
  },
  PUBLISHED: {
    label: "Published",
    badge: "border-[#8aab70]/30 bg-[#8aab70]/[0.07] text-[#b6cf98]",
    description: "This report is included in the public incident archive.",
  },
  CHANGES_REQUESTED: {
    label: "Changes requested",
    badge: "border-[#e2a16d]/30 bg-[#e2a16d]/[0.07] text-[#e2a16d]",
    description: "Review the feedback and update your report to resubmit it.",
  },
};

const summaryStatuses: IncidentStatus[] = [
  "PENDING_REVIEW",
  "PUBLISHED",
  "CHANGES_REQUESTED",
];

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function StatusSummary({ reports }: { reports: MyReport[] }) {
  const statuses =
    reports.some((report) => report.status === "DRAFT")
      ? [...summaryStatuses, "DRAFT" as const]
      : summaryStatuses;

  return (
    <dl className="mb-8 flex flex-wrap border-y border-slate-800/80 py-4 sm:mb-10">
      {statuses.map((status) => {
        const count = reports.filter((report) => report.status === status).length;
        const details = statusDetails[status];

        return (
          <div key={status} className="min-w-[9rem] flex-1 py-1 pr-4">
            <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
              {details.label}
            </dt>
            <dd className="mt-1.5 font-mono text-xl tabular-nums text-[#e8ece4]">
              {count}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function MyReportsList({
  reports,
  error,
}: {
  reports: MyReport[] | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="border-y border-rose-500/30 bg-rose-500/[0.06] px-4 py-5 text-sm text-rose-200 sm:px-5"
      >
        <p className="font-semibold">Unable to load your reports.</p>
        <p className="mt-2 break-words text-rose-200/80">{error}</p>
      </div>
    );
  }

  if (reports === null) {
    return (
      <p role="status" aria-live="polite" className="py-6 text-sm text-slate-400">
        Loading your reports…
      </p>
    );
  }

  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <>
      <StatusSummary reports={reports} />

      {sortedReports.length === 0 ? (
        <div className="border-y border-dashed border-slate-700/80 px-4 py-10 sm:px-5 sm:py-12">
          <h2 className="text-xl font-normal tracking-tight text-[#e8ece4] [font-family:Georgia,'Times_New_Roman',serif]">
            No reports submitted yet
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">
            Your reports and their review progress will appear here.
          </p>
          <Link
            href="/incidents/new"
            className="home-primary-action mt-5 inline-flex min-h-11 items-center gap-3 rounded-none px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Submit your first report
          </Link>
        </div>
      ) : (
        <section aria-labelledby="report-history-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2
              id="report-history-heading"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400"
            >
              Report history
            </h2>
            <p className="text-xs text-slate-500">
              {sortedReports.length} {sortedReports.length === 1 ? "report" : "reports"}
            </p>
          </div>
          <ul className="border-t border-slate-800/80">
            {sortedReports.map((report) => {
              const status = statusDetails[report.status];

              return (
                <li
                  key={report.id}
                  className="border-b border-slate-800/80 py-5 sm:py-6"
                >
                  <article className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-8">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:col-start-1">
                      <h3 className="min-w-0 break-words text-[15px] font-medium leading-6 text-[#e8ece4]">
                        {report.title}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 rounded-sm border px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.08em] ${status.badge}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <time
                      dateTime={report.created_at}
                      className="text-xs text-slate-500 sm:col-start-2 sm:row-start-1 sm:pt-1"
                    >
                      Submitted {formatCreatedAt(report.created_at)}
                    </time>

                    <div className="min-w-0 sm:col-span-2">
                      {report.status === "CHANGES_REQUESTED" ? (
                        <div className="border-l border-[#e2a16d]/50 pl-3 sm:pl-4">
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#d79b75]">
                            Reviewer feedback
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {report.latest_review_reason || status.description}
                          </p>
                          <Link
                            href={`/incidents/${report.id}/edit`}
                            className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#e2a16d] underline decoration-[#e2a16d]/30 underline-offset-4 transition-colors hover:text-[#f0b88f] hover:decoration-[#f0b88f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2a16d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] motion-reduce:transition-none"
                          >
                            Edit and resubmit
                            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <p className="max-w-2xl text-[12px] leading-[1.7] text-slate-500">
                          {status.description}
                        </p>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
