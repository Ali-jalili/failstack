/** @format */

import { redirect } from "next/navigation";
import MyReportsList from "@/features/incidents/components/MyReportsList";
import { getMyReports } from "@/features/incidents/server/queries";

export default async function MyIncidentsPage() {
  const result = await getMyReports();

  if (result.kind === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/my-incidents")}`);
  }

  if (result.kind === "error") {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-6 py-14 text-slate-100">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">
              My incidents
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your reports
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Track the review status of incidents you submitted.
            </p>
          </header>

          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"
          >
            <p className="font-semibold">Unable to load your reports.</p>
            <p className="mt-2 break-words text-rose-200/80">
              {result.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-6 py-14 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-400">
            My incidents
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your reports
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Track the review status of incidents you submitted. When a
            reviewer requests changes, you can see their feedback and
            resubmit.
          </p>
        </header>

        <MyReportsList reports={result.reports} error={null} />
      </div>
    </main>
  );
}
