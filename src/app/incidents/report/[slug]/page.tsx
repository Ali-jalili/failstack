import Link from "next/link";
import { notFound } from "next/navigation";
import PublicIncidentDetail from "@/features/incidents/components/PublicIncidentDetail";
import {
  getPublishedIncidentBySlug,
  getPublishedIncidentSummaries,
  type PublishedIncidentSummary,
} from "@/features/incidents/server/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

function rankRelatedIncidents(
  current: PublishedIncidentSummary,
  candidates: PublishedIncidentSummary[],
) {
  const currentTechnologies = new Set(current.technologies);
  const ranked = candidates
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      const sharedTechnologies = candidate.technologies.filter((technology) =>
        currentTechnologies.has(technology),
      ).length;
      const score =
        (candidate.system === current.system ? 5 : 0) +
        (candidate.pattern === current.pattern ? 3 : 0) +
        sharedTechnologies;
      return { incident: candidate, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.incident.occurred_at) - Date.parse(a.incident.occurred_at),
    );

  const relevant = ranked.filter((item) => item.score > 0);
  return (relevant.length ? relevant : ranked)
    .slice(0, 3)
    .map((item) => item.incident);
}

function ArchiveLoadError() {
  return (
    <main className="home-page min-h-[calc(100dvh-68px)] bg-[#080d16] px-5 py-16 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl rounded-md border border-rose-400/25 bg-rose-400/[0.06] p-6">
        <h1 className="font-serif text-2xl font-normal text-slate-100">
          This report is temporarily unavailable.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Please return to the public archive and try again shortly.
        </p>
        <Link className="public-postmortem-link mt-3" href="/incidents">
          Back to the incident archive
        </Link>
      </div>
    </main>
  );
}

export default async function PublishedIncidentPage({ params }: Props) {
  const { slug } = await params;
  const [detailResult, summaryResult] = await Promise.all([
    getPublishedIncidentBySlug(slug),
    getPublishedIncidentSummaries(),
  ]);

  if (detailResult.error) return <ArchiveLoadError />;
  if (!detailResult.incident) notFound();

  const incident = detailResult.incident;
  const summary: PublishedIncidentSummary = {
    id: incident.id,
    slug: incident.slug,
    title: incident.title,
    company_name: incident.company_name,
    occurred_at: incident.occurred_at,
    duration_minutes: incident.duration_minutes,
    severity: incident.severity,
    pattern: incident.pattern,
    summary: incident.summary,
    system: incident.system,
    technologies: incident.technologies,
  };
  const related = summaryResult.incidents
    ? rankRelatedIncidents(summary, summaryResult.incidents)
    : [];

  return <PublicIncidentDetail incident={incident} related={related} />;
}
