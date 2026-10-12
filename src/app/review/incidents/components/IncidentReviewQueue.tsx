import type { ReviewIncident } from "@/lib/services/incident-review";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-800 pt-5">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-300">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function IncidentReviewQueue({
  incidents,
}: {
  incidents: ReviewIncident[];
}) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-slate-200">
          Review queue is empty
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Incidents submitted for review will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incidents.map((incident) => (
        <article
          key={incident.id}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/10 sm:p-7"
        >
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-amber-300">
                Pending review
              </span>
              <span className="rounded-full border border-slate-700 px-2.5 py-1 font-mono text-[10px] uppercase text-slate-300">
                {incident.severity}
              </span>
              <span className="text-xs text-slate-500">
                Submitted {formatDate(incident.created_at)}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
              {incident.title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {incident.company_name} · {incident.system}
            </p>
          </header>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-mono uppercase text-slate-500">
                Occurred
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {formatDate(incident.occurred_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-500">
                Duration
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {incident.duration_minutes} minutes
              </p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-500">
                Pattern
              </p>
              <p className="mt-1 text-sm capitalize text-slate-200">
                {formatLabel(incident.pattern)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <Section title="Summary">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {incident.summary}
              </p>
            </Section>

            <Section title="Systems and technologies">
              <p className="text-sm text-slate-300">{incident.system}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {incident.technologies.map((technology) => (
                  <li
                    key={technology}
                    className="rounded-md border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {technology}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Timeline">
              <ol className="space-y-4">
                {incident.timeline.map((event) => (
                  <li
                    key={event.id}
                    className="border-l-2 border-blue-500/40 pl-4"
                  >
                    <p className="font-mono text-xs text-blue-300">
                      T+{event.timestampOffsetMinutes}m ·{" "}
                      {formatLabel(event.stage)}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-slate-200">
                      {event.title}
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-400">
                      {event.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Component: {event.affectedComponent}
                    </p>
                    {event.cliCommands && event.cliCommands.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {event.cliCommands.map((command, index) => (
                          <li
                            key={`${event.id}-command-${index}`}
                            className="overflow-x-auto rounded bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300"
                          >
                            {command}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Root cause analysis">
              <ul className="space-y-3">
                {incident.root_cause_tree.map((node) => (
                  <li
                    key={node.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <p className="text-xs font-mono uppercase text-blue-300">
                      {formatLabel(node.type)} · {node.systemComponent}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-slate-200">
                      {node.title}
                    </h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-400">
                      {node.description}
                    </p>
                    {node.parentId && (
                      <p className="mt-2 text-xs text-slate-500">
                        Parent node ID: {node.parentId}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Architecture before / after">
              <p className="text-xs font-mono uppercase text-slate-500">
                {incident.architecture_diff.isFact
                  ? "Documented facts"
                  : "Reconstructed"}
              </p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400">
                    Before
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-300">
                    {incident.architecture_diff.beforeFix}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400">
                    After
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-300">
                    {incident.architecture_diff.afterFix}
                  </p>
                </div>
              </div>
              {incident.architecture_diff.notes && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-semibold uppercase text-slate-400">
                    Reconstruction notes
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-400">
                    {incident.architecture_diff.notes}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Prevention actions">
              <ol className="space-y-3">
                {incident.prevention_actions.map((action, index) => (
                  <li
                    key={`${incident.id}-prevention-${index}`}
                    className="border-l-2 border-emerald-500/40 pl-4"
                  >
                    <h4 className="text-sm font-semibold text-slate-200">
                      {action.title}
                    </h4>
                    {action.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-400">
                        {action.description}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Section>

            {incident.official_post_mortem_url && (
              <Section title="Source">
                <a
                  href={incident.official_post_mortem_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-blue-300 underline decoration-blue-500/40 underline-offset-4 hover:text-blue-200"
                >
                  Official post-mortem
                </a>
              </Section>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
