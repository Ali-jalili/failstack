"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Code2,
  Copy,
  GitBranch,
  Layers3,
  Link2,
  Network,
  Server,
} from "lucide-react";
import type { PublishedIncident } from "@/features/incidents/server/queries";

const severityTone = {
  CRITICAL: "border-rose-400/45 bg-rose-400/10 text-rose-300",
  MAJOR: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  MINOR: "border-[#c6e47c]/35 bg-[#c6e47c]/10 text-[#d5eca0]",
} as const;

const stageTone: Record<string, string> = {
  TRIGGER: "#c6e47c",
  FAILURE: "#fb7185",
  PROPAGATION: "#fb7185",
  IMPACT: "#fb7185",
  DETECTION: "#60a5fa",
  MITIGATION: "#a78bfa",
  ROOT_CAUSE: "#fbbf24",
  PREVENTION: "#34d399",
};

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function offsetLabel(offset: number) {
  return offset === 0 ? "T+0" : `T+${offset}m`;
}

function durationLabel(value: number) {
  if (value < 60) return `${value} minutes`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours} hours`;
}

function SectionLead({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-sky-300">
        <span className="text-[#c6e47c]">{index}</span>{eyebrow}
      </p>
      <h2 className="mt-3 font-normal leading-tight tracking-tight text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif] text-3xl sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-sm text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
        {description}
      </p>
    </div>
  );
}

export default function PublicIncidentDetail({
  incident,
  related,
  onSelect,
}: {
  incident: PublishedIncident;
  related: PublishedIncident[];
  onSelect: (id: string) => void;
}) {
  const events = useMemo(
    () =>
      [...incident.timeline].sort(
        (a, b) => a.timestampOffsetMinutes - b.timestampOffsetMinutes,
      ),
    [incident.timeline],
  );
  const [activeEventId, setActiveEventId] = useState(events[0]?.id ?? null);
  const [activeCauseId, setActiveCauseId] = useState(
    incident.root_cause_tree.find((node) => node.type === "ROOT_CAUSE")?.id ??
      incident.root_cause_tree[0]?.id ?? null,
  );
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    setActiveEventId(events[0]?.id ?? null);
    setActiveCauseId(
      incident.root_cause_tree.find((node) => node.type === "ROOT_CAUSE")?.id ??
        incident.root_cause_tree[0]?.id ?? null,
    );
    const syncSelectionFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash.startsWith("event-")) {
        const id = hash.slice("event-".length);
        if (events.some((event) => event.id === id)) setActiveEventId(id);
      }
      if (hash.startsWith("cause-")) {
        const id = hash.slice("cause-".length);
        if (incident.root_cause_tree.some((node) => node.id === id)) setActiveCauseId(id);
      }
    };
    syncSelectionFromHash();
    window.addEventListener("popstate", syncSelectionFromHash);
    window.addEventListener("hashchange", syncSelectionFromHash);
    return () => {
      window.removeEventListener("popstate", syncSelectionFromHash);
      window.removeEventListener("hashchange", syncSelectionFromHash);
    };
  }, [incident.id, events, incident.root_cause_tree]);

  function selectEvent(id: string) {
    setActiveEventId(id);
    const url = new URL(window.location.href);
    url.hash = `event-${id}`;
    window.history.pushState(null, "", url);
  }

  function selectCause(id: string) {
    setActiveCauseId(id);
    const url = new URL(window.location.href);
    url.hash = `cause-${id}`;
    window.history.pushState(null, "", url);
  }

  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  }

  const activeEvent = events.find((event) => event.id === activeEventId) ?? events[0];
  const rootCause = incident.root_cause_tree.find((node) => node.type === "ROOT_CAUSE");
  const causeRows = useMemo(() => {
    const byParent = new Map<string | null, typeof incident.root_cause_tree>();
    const knownIds = new Set(incident.root_cause_tree.map((node) => node.id));
    for (const node of incident.root_cause_tree) {
      const parentId = node.parentId && knownIds.has(node.parentId) ? node.parentId : null;
      const siblings = byParent.get(parentId) ?? [];
      siblings.push(node);
      byParent.set(parentId, siblings);
    }
    const rows: { node: (typeof incident.root_cause_tree)[number]; depth: number }[] = [];
    const visited = new Set<string>();
    const visit = (parentId: string | null, depth: number) => {
      for (const node of byParent.get(parentId) ?? []) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        rows.push({ node, depth });
        visit(node.id, depth + 1);
      }
    };
    visit(null, 0);
    for (const node of incident.root_cause_tree) {
      if (!visited.has(node.id)) {
        visited.add(node.id);
        rows.push({ node, depth: 0 });
        visit(node.id, 1);
      }
    }
    return rows;
  }, [incident.root_cause_tree]);
  const selectedCause = incident.root_cause_tree.find((node) => node.id === activeCauseId) ?? rootCause;
  const selectedCausePath = useMemo(() => {
    const byId = new Map(incident.root_cause_tree.map((node) => [node.id, node]));
    const path = new Set<string>();
    let node = selectedCause;
    while (node && !path.has(node.id)) {
      path.add(node.id);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    return path;
  }, [incident.root_cause_tree, selectedCause]);
  const componentNames = Array.from(
    new Set([
      ...events.map((event) => event.affectedComponent.trim()),
      ...incident.root_cause_tree.map((node) => node.systemComponent.trim()),
    ].filter(Boolean)),
  );
  const responseEvents = events.filter((event) => event.stage === "MITIGATION");
  const severityClass = severityTone[incident.severity] ?? severityTone.MINOR;

  return (
    <article className="public-report">
      <nav aria-label="Incident navigation" className="mb-5">
        <a href="#related-incidents" className="inline-flex min-h-8 items-center gap-2 text-[11px] text-slate-400 transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Browse incidents
        </a>
      </nav>

      <header className="public-report-hero relative isolate overflow-hidden border-y border-slate-800/80 py-8 sm:py-10 lg:py-12">
        <div className="public-report-art" aria-hidden="true">
          <svg viewBox="0 0 560 300" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="reportPulse">
                <stop offset="0" stopColor="#fb7185" stopOpacity=".9" />
                <stop offset=".22" stopColor="#fb7185" stopOpacity=".28" />
                <stop offset="1" stopColor="#fb7185" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="reportPath" x1="0" x2="1">
                <stop stopColor="#60a5fa" stopOpacity=".1" />
                <stop offset=".52" stopColor="#fb7185" />
                <stop offset="1" stopColor="#c6e47c" stopOpacity=".18" />
              </linearGradient>
            </defs>
            <path d="M20 237 99 196l54 21 62-83 58 33 51-84 60 91 56-30 100 78" fill="none" stroke="#22334a" strokeWidth="1" />
            <path d="M0 267 88 230l66 15 75-88 45 31 60-99 55 83 70-44 101 85" fill="none" stroke="#14253a" strokeWidth="1" />
            <path d="M35 189C122 181 156 216 214 172s70-23 114-69 71 16 103 34 61-5 103 24" fill="none" stroke="url(#reportPath)" strokeWidth="2" strokeDasharray="5 6" />
            <circle cx="329" cy="103" r="80" fill="url(#reportPulse)" />
            <circle cx="329" cy="103" r="27" fill="#fb7185" fillOpacity=".12" stroke="#fb7185" strokeOpacity=".7" />
            <circle cx="329" cy="103" r="7" fill="#fecdd3" />
            <g fill="#0c1726" stroke="#60a5fa" strokeOpacity=".65">
              <rect x="72" y="162" width="34" height="27" rx="3" />
              <rect x="194" y="133" width="34" height="27" rx="3" />
              <rect x="429" y="130" width="34" height="27" rx="3" />
              <rect x="477" y="210" width="34" height="27" rx="3" />
            </g>
            <g fill="#93c5fd">
              <circle cx="89" cy="175" r="3" /><circle cx="211" cy="146" r="3" />
              <circle cx="446" cy="143" r="3" /><circle cx="494" cy="223" r="3" />
            </g>
          </svg>
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,.42fr)] lg:items-center lg:gap-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-slate-400 sm:text-[10px]">
              <span className={`rounded-sm border px-2 py-1 font-semibold ${severityClass}`}>{incident.severity}</span>
              <span>·</span><span>{dateLabel(incident.occurred_at)}</span>
              <span className="text-[#c6e47c]">+</span><span>{durationLabel(incident.duration_minutes)}</span>
              <span className="text-[#c6e47c]">+</span><span>{incident.system}</span>
            </div>
            <h1 className="mt-5 max-w-3xl break-words font-normal leading-[.98] tracking-[-.045em] text-[#f1f1e9] [font-family:Georgia,'Times_New_Roman',serif] text-[clamp(2.5rem,6vw,5rem)]">
              {incident.title}
            </h1>
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-300 sm:text-[15px] sm:leading-7">{incident.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[incident.system, ...incident.technologies, incident.pattern.replaceAll("_", " ").toLowerCase()].map((tag, index) => (
                <span key={`${tag}-${index}`} className="rounded-full border border-sky-300/20 bg-sky-300/[.035] px-2.5 py-1 text-[9px] text-sky-100/75">{tag}</span>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-5 sm:grid-cols-4 lg:grid-cols-1 lg:gap-4 lg:border-l lg:border-t-0 lg:py-1 lg:pl-6">
            <Fact icon={Clock3} label="Incident duration" value={durationLabel(incident.duration_minutes)} />
            <Fact icon={CalendarDays} label="Incident date" value={dateLabel(incident.occurred_at)} />
            <Fact icon={Server} label="Affected service" value={incident.system} />
            <Fact icon={Layers3} label="Technologies" value={incident.technologies.join(" · ") || "Not specified"} />
          </dl>
        </div>
      </header>

      <section className="public-report-section border-b border-slate-800/80 py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(13rem,.34fr)_minmax(0,1fr)] lg:gap-10">
          <SectionLead index="01" eyebrow="Incident story" title="From trigger to recovery" description="Select a moment to follow the report in chronological order." />
          <div className="min-w-0">
            {activeEvent && (
              <div className="mb-5 ml-auto max-w-sm border border-sky-300/25 bg-[#0b1725]/90 p-3 sm:mr-[8%]">
                <p className="font-mono text-[9px] uppercase tracking-[.1em] text-rose-300">{offsetLabel(activeEvent.timestampOffsetMinutes)} · {label(activeEvent.stage)}</p>
                <p className="mt-1 text-xs font-medium text-slate-100">{activeEvent.title}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">{activeEvent.description}</p>
                <p className="mt-2 border-t border-slate-800 pt-2 text-[10px] text-slate-500">Affected component: <span className="text-slate-300">{activeEvent.affectedComponent || "Not specified"}</span></p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <a href={`#event-${activeEvent.id}`} className="inline-flex min-h-7 items-center gap-1 text-[9px] text-sky-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"><Link2 aria-hidden="true" className="h-3 w-3" /> Link to event</a>
                  {activeEvent.cliCommands?.length ? <span className="font-mono text-[9px] text-slate-500">{activeEvent.cliCommands.length} linked command{activeEvent.cliCommands.length === 1 ? "" : "s"}</span> : <span className="text-[9px] text-slate-600">No linked command evidence</span>}
                </div>
                {activeEvent.cliCommands?.length ? <ul className="mt-3 space-y-2 border-t border-slate-800 pt-3" aria-label="Commands linked to this event">
                  {activeEvent.cliCommands.map((command, index) => <li key={`${command}-${index}`} className="relative min-w-0 border-l border-slate-700 bg-black/20 pr-2">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all px-3 py-2 pr-10 font-mono text-[10px] leading-5 text-[#d5eca0]">{command}</pre>
                    <button type="button" onClick={() => void copyCommand(command)} aria-label={copiedCommand === command ? "Command copied" : "Copy command"} className="absolute right-1 top-1 inline-flex h-7 min-w-7 items-center justify-center gap-1 border border-slate-700 px-1.5 text-[9px] text-slate-400 hover:border-sky-300/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                      {copiedCommand === command ? <><Check aria-hidden="true" className="h-3 w-3 text-emerald-300" /><span>Copied</span></> : <><Copy aria-hidden="true" className="h-3 w-3" /><span>Copy</span></>}
                    </button>
                  </li>)}
                </ul> : null}
                {copiedCommand && <p role="status" className="sr-only">Command copied to clipboard.</p>}
              </div>
            )}
            {events.length ? (
              <div className="public-story-scroll overflow-x-auto pb-2">
                <div className="relative min-w-[600px] px-2 pt-2">
                  <svg className="absolute inset-x-2 top-2 h-16 w-[calc(100%-1rem)] overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
                    <defs><linearGradient id="storyLine"><stop stopColor="#c6e47c" /><stop offset=".34" stopColor="#60a5fa" /><stop offset=".55" stopColor="#fb7185" /><stop offset=".78" stopColor="#a78bfa" /><stop offset="1" stopColor="#93c5fd" /></linearGradient></defs>
                    {events.length > 1 && <path d={events.map((event, index) => {
                      const x = 35 + (index * 930) / (events.length - 1);
                      const y = event.stage === "IMPACT" || event.stage === "FAILURE" ? 23 : event.stage === "ROOT_CAUSE" ? 38 : 66;
                      if (index === 0) return `M ${x} ${y}`;
                      const prev = events[index - 1];
                      const px = 35 + ((index - 1) * 930) / (events.length - 1);
                      const py = prev.stage === "IMPACT" || prev.stage === "FAILURE" ? 23 : prev.stage === "ROOT_CAUSE" ? 38 : 66;
                      const mid = (px + x) / 2;
                      return `C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`;
                    }).join(" ")} fill="none" stroke="url(#storyLine)" strokeWidth="2" />}
                    {events.length === 1 && <path d="M35 66 H965" fill="none" stroke="#334155" strokeWidth="1" />}
                  </svg>
                  <ol aria-label="Incident events" className="public-story-events relative flex items-start">
                    {events.map((event) => {
                      const isActive = event.id === activeEvent?.id;
                      const color = stageTone[event.stage] ?? "#93c5fd";
                      return (
                        <li id={`event-${event.id}`} key={event.id} className="public-story-event min-w-0 flex-1 text-center">
                          <button type="button" aria-pressed={isActive} aria-label={`${offsetLabel(event.timestampOffsetMinutes)} ${label(event.stage)}: ${event.title}`} onClick={() => selectEvent(event.id)} className="group relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-[#080d16] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ borderColor: color, boxShadow: isActive ? `0 0 0 5px ${color}20,0 0 18px ${color}55` : undefined }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          </button>
                          <p className="public-story-event-offset mt-3 font-mono text-[9px] tabular-nums text-slate-400">{offsetLabel(event.timestampOffsetMinutes)}</p>
                          <p className="mt-1 text-[10px] font-semibold capitalize" style={{ color }}>{label(event.stage)}</p>
                          <p className="mx-auto mt-1 max-w-28 text-[10px] leading-4 text-slate-400">{event.title}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            ) : <p className="border-y border-dashed border-slate-800 py-6 text-sm text-slate-500">No timeline was included in this report.</p>}
          </div>
        </div>
      </section>

      <section className="public-report-section border-b border-slate-800/80 py-8 sm:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(12rem,.29fr)_minmax(0,.71fr)] lg:gap-10">
          <SectionLead index="02" eyebrow="At the point of impact" title="What was happening?" description={rootCause?.description ?? incident.summary} />
          <div className="grid gap-4 md:grid-cols-[.78fr_1.22fr]">
            <div className="border border-slate-800 bg-[#0a121e]/85 p-4 sm:p-5">
              <p className="font-mono text-[9px] uppercase tracking-[.13em] text-sky-300">Components mentioned</p>
              {componentNames.length ? (
                <ul className="mt-4 space-y-2">
                  {componentNames.map((name, index) => (
                    <li key={name} className="flex items-center gap-2.5 border-b border-slate-800/70 pb-2 text-[11px] text-slate-300 last:border-0">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-sm ${index === 0 ? "bg-rose-400/10 text-rose-300" : "bg-sky-300/10 text-sky-300"}`}><Server aria-hidden="true" className="h-3 w-3" /></span>
                      <span className="min-w-0 flex-1 break-words">{name}</span>
                      <span className="font-mono text-[8px] uppercase text-slate-600">in report</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-xs text-slate-500">No affected components were specified.</p>}
            </div>
            <div className="border border-slate-800 bg-[#0a121e]/85 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[.13em] text-sky-300">Causal relationships as reported</p>
                <GitBranch aria-hidden="true" className="h-4 w-4 text-rose-300" />
              </div>
              {incident.root_cause_tree.length ? (
                <ol aria-label="Causal items, arranged by their recorded parent relationships" className="mt-4 space-y-1">
                  {causeRows.map(({ node, depth }) => {
                    const isSelected = node.id === selectedCause?.id;
                    const isOnPath = selectedCausePath.has(node.id);
                    const color = node.type === "ROOT_CAUSE" ? "#fb7185" : node.type === "CONTRIBUTING_FACTOR" ? "#fbbf24" : node.type === "DIRECT_FAILURE" ? "#a78bfa" : "#93c5fd";
                    return <li key={node.id} id={`cause-${node.id}`} style={{ marginLeft: `${Math.min(depth, 4) * 14}px` }}>
                      <button type="button" aria-pressed={isSelected} onClick={() => selectCause(node.id)} className={`public-cause-option flex min-h-11 w-full items-start gap-2.5 border-l-2 px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${isSelected ? "is-selected" : isOnPath ? "is-on-path" : ""}`} style={{ borderLeftColor: isOnPath ? color : "transparent" }}>
                        <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="min-w-0">
                          <span className="block text-[11px] font-medium text-slate-200">{node.title}</span>
                          <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[.08em] text-slate-500">{label(node.type)} · {node.systemComponent}</span>
                        </span>
                      </button>
                    </li>;
                  })}
                </ol>
                {selectedCause && <div className="mt-3 border-t border-slate-800 pt-3">
                  <p className="font-mono text-[8px] uppercase tracking-[.12em] text-sky-300">Recorded explanation</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-300">{selectedCause.description}</p>
                  <p className="mt-2 text-[9px] text-slate-600">No direct timeline-event or evidence link is recorded for this item.</p>
                </div>}
              ) : <p className="mt-4 text-xs text-slate-500">No causal factors were recorded.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="public-report-section border-b border-slate-800/80 py-8 sm:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(12rem,.29fr)_minmax(0,.71fr)] lg:gap-10">
          <SectionLead index="03" eyebrow="Evidence" title="The root cause" description={rootCause?.description ?? "The report's root cause and supporting system changes."} />
          <div className="overflow-hidden border border-slate-800 bg-[#090f19]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-300"><Code2 aria-hidden="true" className="h-3.5 w-3.5 text-sky-300" /> Configuration / change record</div>
              <span className={`font-mono text-[8px] uppercase tracking-[.1em] ${incident.architecture_diff.isFact ? "text-[#c6e47c]" : "text-amber-300"}`}>{incident.architecture_diff.isFact ? "reported as fact" : "author interpretation"}</span>
            </div>
            <div className="grid divide-y divide-slate-800 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="min-w-0">
                <p className="border-b border-slate-800/80 bg-white/[.02] px-4 py-2 font-mono text-[9px] text-slate-500">Before</p>
                <pre className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-[11px] leading-6 text-rose-200/85">{incident.architecture_diff.beforeFix}</pre>
              </div>
              <div className="min-w-0">
                <p className="border-b border-slate-800/80 bg-white/[.02] px-4 py-2 font-mono text-[9px] text-slate-500">After · as reported</p>
                <pre className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-[11px] leading-6 text-[#d5eca0]">{incident.architecture_diff.afterFix}</pre>
              </div>
            </div>
            {incident.architecture_diff.notes && <p className="border-t border-slate-800 px-4 py-3 text-[11px] leading-5 text-slate-400">{incident.architecture_diff.notes}</p>}
          </div>
        </div>
      </section>

      <section className="public-report-section border-b border-slate-800/80 py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(12rem,.29fr)_minmax(0,.71fr)] lg:items-start lg:gap-10">
          <SectionLead index="04" eyebrow="Impact" title="How it affected the system" description="The report records severity and duration, but no error-rate, latency, or transaction measurements." />
          <div className="grid gap-3 sm:grid-cols-[minmax(8rem,.55fr)_minmax(8rem,.55fr)_minmax(0,1.9fr)]">
            <div className="border border-rose-400/25 bg-rose-400/[.04] p-4"><p className="font-mono text-[8px] uppercase tracking-[.12em] text-slate-500">Reported severity</p><p className="mt-2 text-sm font-semibold text-rose-300">{incident.severity}</p></div>
            <div className="border border-slate-800 bg-[#0a121e]/80 p-4"><p className="font-mono text-[8px] uppercase tracking-[.12em] text-slate-500">Reported duration</p><p className="mt-2 text-sm font-semibold text-slate-100">{durationLabel(incident.duration_minutes)}</p></div>
            <div className="border border-slate-800 bg-[#0a121e]/80 p-4"><p className="font-mono text-[8px] uppercase tracking-[.12em] text-slate-500">Impact summary · {incident.system}</p><p className="mt-2 text-xs leading-5 text-slate-300">{incident.summary}</p></div>
          </div>
        </div>
      </section>

      <section className="public-report-section grid gap-7 border-b border-slate-800/80 py-8 sm:py-10 lg:grid-cols-2 lg:gap-10">
        <div className="grid gap-5 sm:grid-cols-[minmax(10rem,.7fr)_minmax(0,1fr)] sm:gap-7">
          <SectionLead index="05" eyebrow="Resolution" title="Recorded response" description="Mitigation events documented in the incident timeline. This report does not identify a separate recovery event." />
          {responseEvents.length ? <ol className="space-y-4 border-l border-slate-800 pl-5">
            {responseEvents.map((event) => <li key={event.id} className="relative">
              <span className="absolute -left-[1.62rem] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-violet-300/50 bg-[#080d16]"><span className="h-1 w-1 rounded-full bg-violet-300" /></span>
              <p className="font-mono text-[9px] text-violet-300">{offsetLabel(event.timestampOffsetMinutes)}</p>
              <h3 className="mt-1 text-[11px] font-medium text-slate-100">{event.title}</h3>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">{event.description}</p>
            </li>)}
          </ol> : <p className="text-xs text-slate-500">No resolution actions were documented.</p>}
        </div>
        <div className="grid gap-5 border-t border-slate-800/80 pt-7 sm:grid-cols-[minmax(10rem,.7fr)_minmax(0,1fr)] sm:gap-7 lg:border-l lg:border-t-0 lg:py-0 lg:pl-8">
          <SectionLead index="06" eyebrow="Prevention" title="What will prevent this?" description="Follow-up actions included by the report author." />
          {incident.prevention_actions.length ? <ol className="space-y-3">
            {incident.prevention_actions.map((action, index) => <li key={`${action.title}-${index}`} className="flex gap-2.5 text-[11px] leading-5 text-slate-300">
              <span className="font-mono text-[9px] text-[#c6e47c]">{String(index + 1).padStart(2, "0")}</span>
              <span>{action.title}{action.description ? <span className="mt-0.5 block text-[10px] text-slate-500">{action.description}</span> : null}</span>
            </li>)}
          </ol> : <p className="text-xs text-slate-500">No prevention actions were documented.</p>}
        </div>
      </section>

      {incident.official_post_mortem_url && <div className="border-b border-slate-800/80 py-4">
        <a href={incident.official_post_mortem_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-xs text-sky-200 underline decoration-sky-300/30 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Open the official post-mortem <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
      </div>}

      {related.length > 0 && <section id="related-incidents" className="public-report-section py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(12rem,.29fr)_minmax(0,.71fr)] lg:gap-10">
          <SectionLead index="07" eyebrow="Explore more" title="Related incidents" description="Other reviewed reports in the public archive." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => <button key={item.id} type="button" onClick={() => { onSelect(item.id); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }} className="group flex min-h-28 min-w-0 items-start gap-3 border border-slate-800 bg-[#0b1420]/80 p-3 text-left transition-colors hover:border-sky-300/40 hover:bg-[#0e1a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
              <span aria-hidden="true" className="public-related-art relative flex h-[4.5rem] w-14 shrink-0 items-center justify-center overflow-hidden border border-slate-800"><span className="public-related-pulse" /></span>
              <span className="min-w-0 flex-1">
                <span className={`inline-flex rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase ${severityTone[item.severity]}`}>{item.severity}</span>
                <span className="mt-2 block line-clamp-2 text-[11px] font-medium leading-4 text-slate-100">{item.title}</span>
                <span className="mt-1 block text-[9px] text-slate-500">{dateLabel(item.occurred_at)} · {durationLabel(item.duration_minutes)}</span>
              </span>
              <ArrowRight aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-sky-300" />
            </button>)}
          </div>
        </div>
      </section>}
    </article>
  );
}

function Fact({
  icon: Icon,
  label: title,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return <div className="flex min-w-0 gap-3">
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
    <div className="min-w-0"><dt className="font-mono text-[8px] uppercase tracking-[.12em] text-slate-500">{title}</dt><dd className="mt-1 break-words text-[11px] leading-4 text-slate-200">{value}</dd></div>
  </div>;
}

function Metric({
  icon: Icon,
  value,
  label: title,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return <div className="min-w-0 border border-slate-800 bg-[#0a121e]/80 p-3.5 sm:p-4">
    <div className="flex items-center justify-between gap-2"><p className="font-mono text-lg tracking-tight text-sky-200 sm:text-xl">{value}</p><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-300/70" /></div>
    <p className="mt-2 text-[10px] leading-4 text-slate-400">{title}</p>
  </div>;
}
