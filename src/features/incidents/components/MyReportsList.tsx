/** @format */

import Link from "next/link";
import { Plus } from "lucide-react";
import type { MyReport } from "@/features/incidents/server/queries";

const statusStyles: Record<string, string> = {
  PENDING_REVIEW:
    "border-blue-400/30 bg-blue-400/10 text-blue-300",
  PUBLISHED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  CHANGES_REQUESTED:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  DRAFT: "border-slate-600/30 bg-slate-600/10 text-slate-300",
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
        className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"
      >
        <p className="font-semibold">Unable to load your reports.</p>
        <p className="mt-2 break-words text-rose-200/80">{error}</p>
      </div>
    );
  }

  if (reports === null) {
    return (
      <p role="status" className="py-6 text-sm text-slate-400">
        Loading your reports…
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-5 py-8">
        <p className="text-sm text-slate-300">
          You haven&apos;t submitted any incident reports yet.
        </p>
        <Link
          href="/incidents/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Plus className="h-3.5 w-3.5" />
          Submit your first report
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/30">
      {reports.map((report) => (
        <li key={report.id} className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-slate-100">{report.title}</h3>
              <time
                dateTime={report.created_at}
                className="mt-1 block text-xs text-slate-500"
              >
                Submitted {formatCreatedAt(report.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${
                  statusStyles[report.status] ??
                  "border-slate-700 bg-slate-950/60 text-slate-300"
                }`}
              >
                {formatStatus(report.status)}
              </span>
              {report.status === "CHANGES_REQUESTED" && (
                <Link
                  href={`/incidents/${report.id}/edit`}
                  className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/6 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
                >
                  Edit &amp; Resubmit
                </Link>
              )}
            </div>
          </div>
          {report.status === "CHANGES_REQUESTED" &&
            report.latest_review_reason && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <p className="text-xs font-medium text-amber-200">
                  Reviewer feedback
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-300">
                  {report.latest_review_reason}
                </p>
              </div>
            )}
        </li>
      ))}
    </ul>
  );
}
