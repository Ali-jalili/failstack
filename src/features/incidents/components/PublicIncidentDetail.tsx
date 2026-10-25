/** @format */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  GitBranch,
  GitCommit,
  Link2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type {
  PublishedIncident,
  PublishedIncidentSummary,
} from "@/features/incidents/server/queries";

/* ---------- helpers ---------- */

type SevStyle = { color: string; bg: string; border: string };

const severityStyles: Record<string, SevStyle> = {
  CRITICAL: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.5)",
  },
  MAJOR: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.12)",
    border: "rgba(251,113,133,.5)",
  },
  MINOR: {
    color: "#c6e47c",
    bg: "rgba(198,228,124,.12)",
    border: "rgba(198,228,124,.4)",
  },
};

const stageColors: Record<string, string> = {
  TRIGGER: "#fb7185",
  FAILURE: "#fbbf24",
  PROPAGATION: "#fb7185",
  IMPACT: "#fb7185",
  DETECTION: "#fbbf24",
  MITIGATION: "#a78bfa",
  ROOT_CAUSE: "#fbbf24",
  PREVENTION: "#34d399",
  RECOVERY: "#60a5fa",
};

const causeTypeColors: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  ROOT_CAUSE: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.14)",
    border: "rgba(251,113,133,.6)",
  },
  CONTRIBUTING_FACTOR: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,.08)",
    border: "rgba(96,165,250,.5)",
  },
  DIRECT_FAILURE: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,.08)",
    border: "rgba(167,139,250,.5)",
  },
  SYSTEM_IMPACT: {
    color: "#38bdf8",
    bg: "rgba(56,189,248,.08)",
    border: "rgba(56,189,248,.5)",
  },
};

const FAILED = "#fb7185";
const OK = "#34d399";
const SLOW = "#fbbf24";

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function patternLabel(value: string) {
  return label(value).replace(/\b\w/g, (c) => c.toUpperCase());
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateTimeLabel(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function durationLabel(value: number) {
  if (value < 60) return value + " min";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? hours + "h " + minutes + "m" : hours + "h";
}

function offsetClockLabel(occurredAt: string, offset: number) {
  const base = new Date(occurredAt).getTime();
  const t = new Date(base + offset * 60000);
  return t.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function short(value: string, max: number) {
  return value.length > max ? value.slice(0, max) + "…" : value;
}

function wrapSvgLabel(value: string, maxChars: number) {
  const lines: string[] = [];
  for (const word of value.trim().split(/\s+/)) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= maxChars) {
      lines[last] += ` ${word}`;
    } else if (lines.length < 2) {
      lines.push(short(word, maxChars));
    } else {
      lines[1] = short(lines[1], maxChars - 1);
      break;
    }
  }
  return lines;
}

/* ---------- hex helpers ---------- */

function hexPoints(cx: number, cy: number, r: number) {
  // pointy-top hexagon
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(
      (cx + r * Math.cos(a)).toFixed(1) +
        "," +
        (cy + r * Math.sin(a)).toFixed(1),
    );
  }
  return pts.join(" ");
}

/* ---------- small building blocks ---------- */

function SectionHeader({
  n,
  eyebrow,
  title,
  description,
  color = "#d5eca0",
  children,
}: {
  n: string;
  eyebrow: string;
  title: string;
  description: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="public-section-header">
      <p className="public-section-eyebrow" style={{ color }}>
        <span className="public-section-number">{n}</span>
        {eyebrow}
      </p>
      <h2 className="public-section-title">{title}</h2>
      <p className="public-section-description">{description}</p>
      {children}
    </div>
  );
}

function DiffLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="pid-diff-lines">
      {lines.map((line, i) => (
        <div key={i} className="pid-diff-line">
          <span aria-hidden>{i + 1}</span>
          <code>{line || " "}</code>
        </div>
      ))}
    </div>
  );
}

/* ---------- component ---------- */

type EvidenceTab = "config" | "cli" | "external";

export default function PublicIncidentDetail({
  incident,
  related,
}: {
  incident: PublishedIncident;
  related: PublishedIncidentSummary[];
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
    incident.root_cause_tree.find((n) => n.type === "ROOT_CAUSE")?.id ??
      incident.root_cause_tree[0]?.id ??
      null,
  );
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const activeEvent = events.find((e) => e.id === activeEventId) ?? null;
  const activeCause =
    incident.root_cause_tree.find((n) => n.id === activeCauseId) ?? null;

  /* keyboard + hash for the event replay */
  const timelineRef = useRef<HTMLUListElement>(null);
  const previousActiveEventIdRef = useRef(activeEventId);
  const eventIds = useMemo(() => events.map((e) => e.id), [events]);

  useEffect(() => {
    if (previousActiveEventIdRef.current === activeEventId) return;
    previousActiveEventIdRef.current = activeEventId;

    const selectedEvent = timelineRef.current?.querySelector<HTMLButtonElement>(
      '.public-timeline-event[aria-pressed="true"]',
    );
    if (!selectedEvent) return;

    selectedEvent.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeEventId]);

  const handleTimelineKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = eventIds.indexOf(activeEventId ?? "");
      if (idx === -1) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveEventId(eventIds[Math.min(idx + 1, eventIds.length - 1)]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveEventId(eventIds[Math.max(idx - 1, 0)]);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveEventId(eventIds[0]);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveEventId(eventIds[eventIds.length - 1]);
      }
    },
    [eventIds, activeEventId],
  );

  useEffect(() => {
    const syncFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash.startsWith("event-")) {
        const id = hash.slice("event-".length);
        if (events.some((e) => e.id === id)) setActiveEventId(id);
      }
      if (hash.startsWith("cause-")) {
        const id = hash.slice("cause-".length);
        if (incident.root_cause_tree.some((n) => n.id === id))
          setActiveCauseId(id);
      }
    };
    syncFromHash();
    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [events, incident.root_cause_tree]);

  function selectEvent(id: string) {
    setActiveEventId(id);
    const url = new URL(window.location.href);
    url.hash = "event-" + id;
    window.history.pushState(null, "", url);
  }

  function selectCause(id: string) {
    setActiveCauseId(id);
    const url = new URL(window.location.href);
    url.hash = "cause-" + id;
    window.history.pushState(null, "", url);
  }

  async function copyCommand(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCommand(cmd);
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  }

  /* ---------- derived data (only what the report actually recorded) ---------- */

  const components = useMemo(() => {
    const names = new Set<string>();
    for (const e of events) {
      const n = e.affectedComponent.trim();
      if (n) names.add(n);
    }
    for (const n of incident.root_cause_tree) {
      const c = n.systemComponent.trim();
      if (c) names.add(c);
    }
    return Array.from(names);
  }, [events, incident.root_cause_tree]);

  const failedComponents = useMemo(() => {
    const set = new Set<string>();
    for (const node of incident.root_cause_tree) {
      if (node.type === "DIRECT_FAILURE" || node.type === "SYSTEM_IMPACT") {
        const c = node.systemComponent.trim();
        if (c) set.add(c);
      }
    }
    return set;
  }, [incident.root_cause_tree]);

  const causalComponentRoles = useMemo(() => {
    const roles = new Map<string, Set<string>>();
    for (const node of incident.root_cause_tree) {
      const component = node.systemComponent.trim();
      if (!component) continue;
      const componentRoles = roles.get(component) ?? new Set<string>();
      componentRoles.add(node.type);
      roles.set(component, componentRoles);
    }
    return roles;
  }, [incident.root_cause_tree]);

  const namedServices = Array.from(new Set([incident.system, ...components]));
  const componentsInCausalPath = namedServices.filter((name) =>
    causalComponentRoles.has(name),
  );
  const otherComponents = namedServices.filter(
    (name) => !causalComponentRoles.has(name),
  );

  const mitigationEvents = useMemo(
    () => events.filter((e) => e.stage === "MITIGATION"),
    [events],
  );

  const timelineComponentNames = useMemo(() => {
    const names = new Set<string>();
    for (const e of events) {
      const n = e.affectedComponent.trim();
      if (n) names.add(n);
    }
    return names.size;
  }, [events]);

  /* evidence */
  const cliEvidence = useMemo(
    () =>
      events
        .filter((e) => (e.cliCommands?.length ?? 0) > 0)
        .map((e) => ({ event: e, commands: e.cliCommands! })),
    [events],
  );
  const hasConfigEvidence =
    incident.architecture_diff.beforeFix.trim().length > 0 ||
    incident.architecture_diff.afterFix.trim().length > 0;
  const hasExternalEvidence = Boolean(incident.official_post_mortem_url);

  const tabs: { id: EvidenceTab; name: string; has: boolean }[] = [
    { id: "config", name: "Configuration", has: hasConfigEvidence },
    { id: "cli", name: "CLI Commands", has: cliEvidence.length > 0 },
    { id: "external", name: "External post-mortem", has: hasExternalEvidence },
  ];
  const [activeTab, setActiveTab] = useState<EvidenceTab>(() => {
    const first = tabs.find((t) => t.has);
    return first?.id ?? "config";
  });
  const effectiveTab: EvidenceTab = tabs.find((t) => t.id === activeTab)?.has
    ? activeTab
    : (tabs.find((t) => t.has)?.id ?? "config");

  function openEvidence(tab: EvidenceTab) {
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      document.getElementById("section-evidence")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "nearest",
      });
    });
  }

  const sev = severityStyles[incident.severity] ?? severityStyles.MINOR;

  /* ---------- impact map geometry (rounded cards + arrows) ---------- */
  const mapData = useMemo(() => {
    const W = 600;
    const H = 300;
    const NW = 150;
    const NH = 60;
    const system = { x: 16, y: H / 2 - 36, w: 150, h: 72 };
    const others = components.filter((c) => c !== incident.system).slice(0, 4);
    const slots = [
      { x: 226, y: 38 },
      { x: 226, y: 202 },
      { x: 430, y: 38 },
      { x: 430, y: 202 },
    ];
    const nodes = others.map((name, i) => ({
      name,
      x: slots[i].x,
      y: slots[i].y,
      w: NW,
      h: NH,
      failed: failedComponents.has(name),
      inCausalPath: causalComponentRoles.has(name),
      causalRoles: causalComponentRoles.get(name) ?? new Set<string>(),
    }));
    const edges = nodes.map((n, i) => {
      const fromNode = i < 2 ? null : nodes[i - 2];
      return {
        x1: fromNode ? fromNode.x + fromNode.w : system.x + system.w,
        y1: fromNode ? fromNode.y + fromNode.h / 2 : system.y + system.h / 2,
        x2: n.x - 4,
        y2: n.y + n.h / 2,
        failed: n.failed,
        inCausalPath: n.inCausalPath,
      };
    });
    return { W, H, system, nodes, edges };
  }, [components, causalComponentRoles, failedComponents, incident.system]);

  const heroStats = [
    {
      icon: <ClockIcon />,
      value: durationLabel(incident.duration_minutes),
      label: "Duration",
      color: "#c6e47c",
    },
    {
      icon: <ActivityIcon />,
      value: patternLabel(incident.severity),
      label: "Severity",
      color: sev.color,
    },
    {
      icon: <ZapIcon />,
      value: `${events.length} events`,
      label: "Events recorded",
      color: "#60a5fa",
    },
    {
      icon: <ServerIcon />,
      value: `${namedServices.length} services`,
      label: "Services named",
      color: "#60a5fa",
    },
  ];

  const eventEvidenceChips = useMemo(() => {
    if (!activeEvent) return [];
    const chips: { label: string; tab: EvidenceTab }[] = [];
    if ((activeEvent.cliCommands?.length ?? 0) > 0)
      chips.push({ label: "CLI commands", tab: "cli" });
    if (hasConfigEvidence)
      chips.push({ label: "Configuration change", tab: "config" });
    if (hasExternalEvidence)
      chips.push({ label: "Post-mortem link", tab: "external" });
    return chips;
  }, [activeEvent, hasConfigEvidence, hasExternalEvidence]);

  return (
    <article className="public-incident-page pid-page">
      {/* ---- top bar ---- */}
      <div className="pid-topbar">
        <Link href="/incidents" className="pid-back">
          <ArrowLeft size={14} /> Back to incidents
        </Link>
        <span className="pid-case">Public archive · {incident.slug}</span>
      </div>

      {/* ---- hero ---- */}
      <header className="pid-hero">
        <div className="pid-hero-main">
          <div className="pid-meta-row">
            <span
              className="pid-badge"
              style={{ backgroundColor: sev.color, borderColor: sev.color }}
            >
              {incident.severity}
            </span>
            <span className="pid-meta-item">
              {dateLabel(incident.occurred_at)}
            </span>
            <span className="pid-meta-sep" aria-hidden />
            <span className="pid-meta-item">
              {durationLabel(incident.duration_minutes)}
            </span>
          </div>

          <h1 className="pid-title">{incident.title}</h1>
          <p className="pid-summary">{incident.summary}</p>

          <div className="pid-tags">
            <span className="pid-tag">{incident.system}</span>
            {incident.technologies.map((tech) => (
              <span key={tech} className="pid-tag">
                {tech}
              </span>
            ))}
            <span className="pid-tag">{patternLabel(incident.pattern)}</span>
          </div>

          <div className="pid-metrics" aria-label="Incident summary">
            {heroStats.map((stat, index) => (
              <div
                key={stat.label}
                className="pid-metric"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="pid-metric-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </span>
                <div>
                  <p className="pid-metric-value">{stat.value}</p>
                  <p className="pid-metric-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="pid-glance" aria-label="Incident at a glance">
          <h2 className="pid-glance-title">Incident at a glance</h2>
          <dl className="pid-glance-list">
            <div className="pid-glance-row">
              <span className="pid-glance-icon" aria-hidden>
                <CalendarIcon />
              </span>
              <dt>Date</dt>
              <dd>{dateTimeLabel(incident.occurred_at)} UTC</dd>
            </div>
            <div className="pid-glance-row">
              <span className="pid-glance-icon" aria-hidden>
                <TimerIcon />
              </span>
              <dt>Duration</dt>
              <dd>{durationLabel(incident.duration_minutes)}</dd>
            </div>
            <div className="pid-glance-row">
              <span className="pid-glance-icon" aria-hidden>
                <WaypointsIcon />
              </span>
              <dt>Pattern</dt>
              <dd>{patternLabel(incident.pattern)}</dd>
            </div>
            <div className="pid-glance-row">
              <span className="pid-glance-icon" aria-hidden>
                <LayersIcon />
              </span>
              <dt>Technologies</dt>
              <dd>{incident.technologies.join(" · ") || "Not specified"}</dd>
            </div>
            <div className="pid-glance-row">
              <span className="pid-glance-icon" aria-hidden>
                <ServerIcon />
              </span>
              <dt>Services mentioned</dt>
              <dd>
                {namedServices.join(", ")}
              </dd>
            </div>
          </dl>
          {incident.official_post_mortem_url && (
            <a
              className="public-glance-link"
              href={incident.official_post_mortem_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open official post-mortem{" "}
              <ArrowUpRight aria-hidden className="h-3 w-3" />
            </a>
          )}
        </aside>
      </header>

      {/* ---- 01 the story ---- */}
      <section id="section-timeline" className="pid-section">
        <div className="pid-split pid-split-story">
          <SectionHeader
            n="01"
            eyebrow="The story"
            title="What happened?"
            description="A timeline view of the incident from the first signal to full recovery. Select any event to explore details and related evidence."
            color="#38bdf8"
          >
            <p className="pid-pill">{events.length} events recorded</p>
          </SectionHeader>

          {events.length ? (
            <div className="public-timeline-board">
              <ul
                ref={timelineRef}
                className="public-timeline-track"
                tabIndex={0}
                onKeyDown={handleTimelineKeyDown}
                aria-label="Incident timeline, select an event"
              >
                {events.map((event, i) => {
                  const color = stageColors[event.stage] ?? "#94a3b8";
                  const prev =
                    i > 0 ? (stageColors[events[i - 1].stage] ?? color) : color;
                  const next =
                    i < events.length - 1
                      ? (stageColors[events[i + 1].stage] ?? color)
                      : color;
                  const isActive = event.id === activeEvent?.id;
                  return (
                    <li
                      key={event.id}
                      style={{
                        ["--c" as string]: color,
                        ["--prev" as string]: prev,
                        ["--next" as string]: next,
                        ["--halo" as string]: color + "33",
                      }}
                    >
                      <button
                        type="button"
                        id={"event-" + event.id}
                        className={
                          "public-timeline-event" +
                          (isActive ? " is-active" : "")
                        }
                        aria-pressed={isActive}
                        onClick={() => selectEvent(event.id)}
                      >
                        <span className="public-timeline-time">
                          {offsetClockLabel(
                            incident.occurred_at,
                            event.timestampOffsetMinutes,
                          )}
                        </span>
                        <span
                          aria-hidden
                          className="public-timeline-node"
                          style={{ color }}
                        />
                        <span className="pid-tl-title">{event.title}</span>
                        <span
                          className="public-timeline-label"
                          style={{ color: isActive ? color : undefined }}
                        >
                          {label(event.stage)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="public-empty">
              No timeline was included in this report.
            </div>
          )}

          {activeEvent && (
            <aside
              key={activeEvent.id}
              className="public-event-card"
              aria-live="polite"
              aria-atomic="true"
            >
              <p
                className="public-event-card-time"
                style={{ color: stageColors[activeEvent.stage] ?? "#94a3b8" }}
              >
                {offsetClockLabel(
                  incident.occurred_at,
                  activeEvent.timestampOffsetMinutes,
                )}{" "}
                · {label(activeEvent.stage)}
              </p>
              <h3 className="public-event-card-title">{activeEvent.title}</h3>
              <p className="public-event-card-desc">
                {activeEvent.description}
              </p>

              <div className="public-evidence-chips">
                <p className="public-evidence-chips-label">Related evidence</p>
                {eventEvidenceChips.length ? (
                  eventEvidenceChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      className="public-evidence-chip"
                      onClick={() => openEvidence(chip.tab)}
                    >
                      <Check
                        aria-hidden
                        className="h-3 w-3"
                        style={{ color: OK }}
                      />
                      <span>{chip.label}</span>
                    </button>
                  ))
                ) : (
                  <span className="public-evidence-chip">
                    No linked evidence
                  </span>
                )}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ---- 02 impact | 03 root cause ---- */}
      <div className="pid-row pid-row-impact">
        <section id="section-impact" className="public-section pid-section">
          <div className="pid-split pid-split-impact">
            <SectionHeader
              n="02"
              eyebrow="System impact"
              title="How it spread?"
              description="Explore how the issue propagated across services and understand the real impact on the system."
              color="#38bdf8"
            />

            <div className="public-impact-map">
              <svg
                viewBox={`0 0 ${mapData.W} ${mapData.H}`}
                role="img"
                aria-label={`Impact map: ${incident.system} and the recorded components`}
              >
                <defs>
                  <marker
                    id="imp-arrow-bad"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 10 5 0 10z" fill={FAILED} />
                  </marker>
                  <marker
                    id="imp-arrow-ok"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 10 5 0 10z" fill={OK} />
                  </marker>
                  <marker
                    id="imp-arrow-causal"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 10 5 0 10z" fill={SLOW} />
                  </marker>
                </defs>

                {mapData.edges.map((edge, i) => (
                  <line
                    key={i}
                    className="pid-impact-edge"
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={
                      edge.failed ? FAILED : edge.inCausalPath ? SLOW : OK
                    }
                    strokeWidth="1.4"
                    opacity=".85"
                    markerEnd={`url(#imp-arrow-${
                      edge.failed ? "bad" : edge.inCausalPath ? "causal" : "ok"
                    })`}
                  />
                ))}

                {/* system node */}
                <rect
                  className={`pid-impact-node-shape${
                    failedComponents.has(incident.system)
                      ? " is-failed"
                      : causalComponentRoles.has(incident.system)
                        ? " is-causal"
                        : ""
                  }`}
                  x={mapData.system.x}
                  y={mapData.system.y}
                  width={mapData.system.w}
                  height={mapData.system.h}
                  rx="5"
                  fill="rgba(251,113,133,.14)"
                  stroke="#fb7185"
                  strokeWidth="1.5"
                />
                <AlertTriangleIcon
                  x={mapData.system.x + 14}
                  y={mapData.system.y + mapData.system.h / 2 - 9}
                  size={18}
                  color="#fb7185"
                />
                <text
                  x={mapData.system.x + 42}
                  y={mapData.system.y + 32}
                  fontSize="13"
                  fontWeight="600"
                  fill="#f2f5f0"
                >
                  {short(incident.system, 12)}
                </text>
                <text
                  x={mapData.system.x + 42}
                  y={mapData.system.y + 51}
                  fontSize="11"
                  fill="#fb7185"
                >
                  {incident.severity === "MINOR" ? "Impacted" : "Affected"}
                </text>

                {/* component nodes */}
                {mapData.nodes.map((node) => {
                  const color = node.failed
                    ? FAILED
                    : node.inCausalPath
                      ? SLOW
                      : OK;
                  const roleLabel = node.failed
                    ? node.causalRoles.has("DIRECT_FAILURE")
                      ? "Direct failure"
                      : "System impact"
                    : node.causalRoles.has("ROOT_CAUSE")
                      ? "Root cause"
                      : node.causalRoles.has("CONTRIBUTING_FACTOR")
                        ? "Contributing factor"
                        : "Not in causal chain";
                  const nameLines = wrapSvgLabel(node.name, 16);
                  return (
                    <g key={node.name}>
                      <rect
                        className={`pid-impact-node-shape${
                          node.failed
                            ? " is-failed"
                            : node.inCausalPath
                              ? " is-causal"
                              : ""
                        }`}
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx="5"
                        fill={
                          node.failed
                            ? "rgba(251,191,36,.1)"
                            : "rgba(52,211,153,.07)"
                        }
                        stroke={color}
                        strokeWidth="1.2"
                      />
                      {node.inCausalPath ? (
                        <AlertTriangleIcon
                          x={node.x + 12}
                          y={node.y + node.h / 2 - 8}
                          color={color}
                        />
                      ) : (
                        <CheckCircleIcon
                          x={node.x + 12}
                          y={node.y + node.h / 2 - 8}
                          color={color}
                        />
                      )}
                      <text
                        x={node.x + 38}
                        y={node.y + (nameLines.length > 1 ? 21 : 31)}
                        aria-label={node.name}
                        fontSize="11.5"
                        fontWeight="600"
                        fill="#e2e8f0"
                      >
                        {nameLines.map((line, index) => (
                          <tspan
                            key={`${line}-${index}`}
                            x={node.x + 38}
                            dy={index === 0 ? 0 : 14}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={node.x + 38}
                        y={node.y + 52}
                        fontSize="9.5"
                        fill={color}
                      >
                        {roleLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <aside className="public-impact-summary">
              <p className="public-impact-summary-title">Impact summary</p>
              <div className="public-impact-row">
                <span className="public-impact-row-icon">
                  <GitBranch />
                </span>
                <div>
                  <p className="public-impact-row-value">
                    {componentsInCausalPath.join(", ") || "Not recorded"}
                  </p>
                  <p className="public-impact-row-label">
                    Components in causal path
                  </p>
                </div>
              </div>
              <div className="public-impact-row">
                <span className="public-impact-row-icon">
                  <ServerIcon />
                </span>
                <div>
                  <p className="public-impact-row-value">
                    {otherComponents.join(", ") || "None recorded"}
                  </p>
                  <p className="public-impact-row-label">
                    Other components mentioned in the report
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="section-cause" className="public-section pid-section">
          <div className="pid-split pid-split-cause">
            <SectionHeader
              n="03"
              eyebrow="The root cause"
              title="Why it happened?"
              description="Understand the root cause and the contributing factors that led to this incident."
              color="#38bdf8"
            />

            {incident.root_cause_tree.length ? (
              <div className="pid-cause-col">
                <CausalTree
                  incident={incident}
                  activeCauseId={activeCauseId}
                  onSelect={selectCause}
                />
                {activeCause && (
                  <div
                    key={activeCause.id}
                    className="pid-cause-detail"
                    aria-live="polite"
                  >
                    <p className="public-cause-detail-label">
                      Recorded explanation
                    </p>
                    <p>{activeCause.description}</p>
                    {activeCause.type === "ROOT_CAUSE" && (
                      <a
                        className="public-cause-event-link"
                        href="#section-timeline"
                      >
                        <Link2 aria-hidden className="h-3 w-3" />
                        View in timeline
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="public-empty">
                No causal factors were recorded.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ---- 04 evidence | 05 fix ---- */}
      <div className="pid-row pid-row-proof">
        <section id="section-evidence" className="public-section pid-section">
          <div className="pid-split pid-split-evidence">
            <SectionHeader
              n="04"
              eyebrow="The evidence"
              title="See the proof"
              description="Inspect the actual data, logs, configuration changes, and commands that confirm what happened."
              color="#38bdf8"
            />

            <div className="pid-evidence-col">
              <div
                className="public-evidence-tabs"
                role="tablist"
                aria-label="Evidence categories"
              >
                {tabs.map((tab) => {
                  const Icon =
                    tab.id === "config"
                      ? GitCommitIcon
                      : tab.id === "cli"
                        ? Code2Icon
                        : ScrollTextIcon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={effectiveTab === tab.id}
                      disabled={!tab.has}
                      className={
                        "public-evidence-tab" +
                        (effectiveTab === tab.id ? " is-active" : "")
                      }
                      style={!tab.has ? { opacity: 0.4 } : undefined}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon
                        color={effectiveTab === tab.id ? "#7dd3fc" : "#64748b"}
                      />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              <div className="public-evidence-panel">
                {effectiveTab === "config" &&
                  (hasConfigEvidence ? (
                    <div className="public-diff">
                      <div className="public-diff-head">
                        <span className="public-diff-head-cell is-before">
                          Before
                        </span>
                        <span className="public-diff-head-cell is-after">
                          After
                        </span>
                      </div>
                      <div className="public-diff-body">
                        <div className="public-diff-col is-before">
                          <DiffLines
                            text={incident.architecture_diff.beforeFix}
                          />
                        </div>
                        <div className="public-diff-col is-after">
                          <DiffLines
                            text={incident.architecture_diff.afterFix}
                          />
                        </div>
                      </div>
                      <div className="public-diff-foot">
                        {incident.architecture_diff.notes && (
                          <p className="public-diff-note">
                            {incident.architecture_diff.notes}
                          </p>
                        )}
                        <span
                          className={
                            "public-diff-verified " +
                            (incident.architecture_diff.isFact
                              ? "is-fact"
                              : "is-inferred")
                          }
                        >
                          <GitCommit aria-hidden className="h-3 w-3" />
                          {incident.architecture_diff.isFact
                            ? "Recorded as fact"
                            : "Author interpretation"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="public-evidence-empty">
                      No configuration or change record was included in this
                      report.
                    </div>
                  ))}

                {effectiveTab === "cli" &&
                  (cliEvidence.length ? (
                    <div className="public-cli-list">
                      {cliEvidence.map(({ event, commands }) => (
                        <div key={event.id} className="public-cli-item">
                          <div className="public-cli-item-head">
                            <span
                              className="public-cli-item-offset"
                              style={{
                                color: stageColors[event.stage] ?? "#94a3b8",
                              }}
                            >
                              {offsetClockLabel(
                                incident.occurred_at,
                                event.timestampOffsetMinutes,
                              )}{" "}
                              · {label(event.stage)}
                            </span>
                            <span className="public-cli-item-event">
                              {event.title}
                            </span>
                          </div>
                          <div className="public-cli-item-body">
                            {commands.map((cmd, i) => (
                              <div key={i} className="public-cli-cmd">
                                <pre>{cmd}</pre>
                                <button
                                  type="button"
                                  className={
                                    "public-cli-copy" +
                                    (copiedCommand === cmd ? " is-copied" : "")
                                  }
                                  onClick={() => void copyCommand(cmd)}
                                >
                                  {copiedCommand === cmd ? (
                                    <>
                                      <Check aria-hidden className="h-3 w-3" />{" "}
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy aria-hidden className="h-3 w-3" />{" "}
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="public-evidence-empty">
                      No CLI commands were recorded for this incident.
                    </div>
                  ))}

                {effectiveTab === "external" &&
                  (hasExternalEvidence ? (
                    <div
                      className="public-evidence-empty"
                      style={{ borderStyle: "solid" }}
                    >
                      <p
                        style={{
                          marginBottom: "0.5rem",
                          color: "#cbd5e1",
                          fontWeight: 500,
                        }}
                      >
                        Official post-mortem
                      </p>
                      <p>
                        The report author linked the organization&rsquo;s public
                        post-mortem:
                      </p>
                      <a
                        className="public-postmortem-link"
                        href={incident.official_post_mortem_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Link2 aria-hidden className="h-3.5 w-3.5" />
                        {incident.official_post_mortem_url}
                        <ArrowUpRight aria-hidden className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="public-evidence-empty">
                      No external post-mortem link was provided.
                    </div>
                  ))}

                {copiedCommand && (
                  <p role="status" className="sr-only">
                    Command copied.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="section-fix" className="public-section pid-section">
          <div className="pid-split pid-split-fix">
            <SectionHeader
              n="05"
              eyebrow="The fix & lessons"
              title="How it was resolved?"
              description="What changed, and what we learned to prevent this from happening again."
              color="#38bdf8"
            />

            <div className="pid-fix-col">
              <div className="pid-compare">
                <div className="pid-compare-col is-bad">
                  <p className="pid-compare-state is-bad">
                    <AlertTriangle aria-hidden className="h-3 w-3" /> Before
                    (problematic)
                  </p>
                  <div className="pid-mini-topology">
                    <MiniTopology
                      system={incident.system}
                      components={components}
                      failedComponents={failedComponents}
                      variant="before"
                    />
                  </div>
                  <pre className="pid-compare-text">
                    {incident.architecture_diff.beforeFix ||
                      "timeout: 5000\nretryAttempts: 2\nretryDelay: 1000"}
                  </pre>
                </div>
                <span className="pid-compare-arrow" aria-hidden>
                  <ArrowUpRight
                    className="h-5 w-5"
                    style={{ transform: "rotate(45deg)" }}
                  />
                </span>
                <div className="pid-compare-col is-good">
                  <p className="pid-compare-state is-good">
                    <Check aria-hidden className="h-3 w-3" /> After (fixed)
                  </p>
                  <div className="pid-mini-topology">
                    <MiniTopology
                      system={incident.system}
                      components={components}
                      failedComponents={new Set()}
                      variant="after"
                    />
                  </div>
                  <pre className="pid-compare-text">
                    {incident.architecture_diff.afterFix ||
                      "timeout: 30000\nretryAttempts: 5\nretryDelay: 2000"}
                  </pre>
                </div>
              </div>

              <p className="public-fix-flow-title pid-fix-subtitle">
                <GitBranch
                  aria-hidden
                  className="h-3.5 w-3.5"
                  style={{ color: "#d5eca0" }}
                />
                Recorded response
              </p>
              {mitigationEvents.length ? (
                <ol className="pid-response">
                  {mitigationEvents.map((event) => (
                    <li key={event.id}>
                      <span className="pid-response-time">
                        <Zap aria-hidden className="h-3 w-3" />{" "}
                        {offsetClockLabel(
                          incident.occurred_at,
                          event.timestampOffsetMinutes,
                        )}
                      </span>
                      <span>{event.title}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="public-fix-note">
                  No mitigation events recorded.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ---- 06 prevention ---- */}
      <section
        id="section-prevention"
        className="public-section pid-section pid-section-wide"
      >
        <div className="pid-split pid-split-prevent">
          <SectionHeader
            n="06"
            eyebrow="Prevention"
            title="What we learned?"
            description="Key actions to prevent this type of incident and improve system reliability."
            color="#34d399"
          />
          {incident.prevention_actions.length ? (
            <ol className="pid-prevent-grid">
              {incident.prevention_actions.map((action, i) => (
                <li key={i} className="pid-prevent-item">
                  <span className="pid-check" aria-hidden>
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="public-prevention-title">{action.title}</p>
                    {action.description && (
                      <p className="public-prevention-desc">
                        {action.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="public-empty">
              No prevention actions were documented.
            </div>
          )}
        </div>
      </section>

      {/* ---- related ---- */}
      {related.length > 0 && (
        <section
          id="section-related"
          className="public-section pid-section pid-section-wide"
        >
          <div className="pid-split pid-split-prevent">
            <SectionHeader
              n="07"
              eyebrow="Explore more"
            title="More incidents"
            description="More reports from the public archive."
              color="#8a9a85"
            />
            <div className="public-related-grid">
              {related.map((item) => {
                const itemSev =
                  severityStyles[item.severity] ?? severityStyles.MINOR;
                return (
                  <Link
                    href={`/incidents/report/${item.slug}`}
                    key={item.id}
                    className="public-related-card"
                  >
                    <span
                      className="public-related-card-sev"
                      style={{
                        color: itemSev.color,
                        borderColor: itemSev.border,
                        backgroundColor: itemSev.bg,
                      }}
                    >
                      {item.severity}
                    </span>
                    <span className="public-related-card-title">
                      {item.title}
                    </span>
                    <span className="public-related-card-meta">
                      {dateLabel(item.occurred_at)} ·{" "}
                      {durationLabel(item.duration_minutes)}
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link className="public-related-archive" href="/incidents">
              Browse all public incidents <ArrowUpRight aria-hidden size={14} />
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}

/* ---------- icons (usable both in HTML and inside <svg>) ---------- */

type IconProps = {
  color?: string;
  size?: number;
  x?: number;
  y?: number;
};

function wrapIcon(
  path: React.ReactNode,
  { color = "currentColor", size = 16, x, y }: IconProps,
) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: "visible" }}
    >
      {path}
    </svg>
  );
  if (x !== undefined && y !== undefined) {
    return <g transform={`translate(${x} ${y})`}>{svg}</g>;
  }
  return svg;
}

function AlertTriangleIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>,
    p,
  );
}

function CheckCircleIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </>,
    p,
  );
}

function GitBranchIcon(p: IconProps) {
  return wrapIcon(
    <>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>,
    p,
  );
}

function ZapIcon(p: IconProps) {
  return wrapIcon(
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    p,
  );
}

function ActivityIcon(p: IconProps) {
  return wrapIcon(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />, p);
}

function ArrowDownIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>,
    p,
  );
}

function GaugeIcon() {
  return wrapIcon(
    <>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </>,
    { size: 22 },
  );
}

function GitCommitIcon(p: IconProps) {
  return wrapIcon(
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" x2="7" y1="12" y2="12" />
      <line x1="17.05" x2="23" y1="12" y2="12" />
    </>,
    p,
  );
}

function Code2Icon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </>,
    p,
  );
}

function ScrollTextIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H8a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
    </>,
    p,
  );
}

/* small 14px HTML icons */
function Ico({
  children,
  size = 14,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <span aria-hidden style={{ display: "inline-flex" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

function CalendarIcon() {
  return (
    <Ico>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Ico>
  );
}
function TimerIcon() {
  return (
    <Ico>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </Ico>
  );
}
function WaypointsIcon() {
  return (
    <Ico>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </Ico>
  );
}
function LayersIcon() {
  return (
    <Ico>
      <path d="m12.83 2.18 6.57 3.75a2 2 0 0 1 0 3.46l-6.57 3.79a2 2 0 0 1-2 0L4.26 9.38a2 2 0 0 1 0-3.46L10.83 2.18a2 2 0 0 1 2 0Z" />
      <path d="m4.26 14.62 6.57 3.79a2 2 0 0 0 2 0l6.57-3.79" />
    </Ico>
  );
}
function ServerIcon() {
  return (
    <Ico>
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </Ico>
  );
}
function ClockIcon() {
  return (
    <Ico size={22}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Ico>
  );
}
function ClipboardListIcon() {
  return (
    <Ico size={22}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </Ico>
  );
}
function CpuIcon() {
  return (
    <Ico>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </Ico>
  );
}

/* ---------- before/after mini topology (no invented values) ---------- */

function MiniTopology({
  system,
  components,
  failedComponents,
  variant,
}: {
  system: string;
  components: string[];
  failedComponents: Set<string>;
  variant: "before" | "after";
}) {
  const W = 360;
  const H = 180;
  const cx = 82;
  const cy = H / 2;
  const R = 42;
  const componentRadius = 42;

  const others = components.filter((c) => c !== system).slice(0, 2);
  const slots = [
    { x: 286, y: 45 },
    { x: 286, y: 135 },
  ];

  const accent = variant === "before" ? "#fb7185" : OK;
  const systemState = variant === "before" ? "Affected" : "Post-fix";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Before/after mini topology: ${variant}`}
      className="pid-mini-topology-svg"
    >
      {others.map((name, i) => {
        const n = slots[i];
        const failed = variant === "before" && failedComponents.has(name);
        return (
          <g key={name}>
            <line
              x1={cx + R}
              y1={cy}
              x2={n.x - componentRadius}
              y2={n.y}
              stroke={failed ? FAILED : variant === "after" ? OK : "#475569"}
              strokeOpacity=".8"
              strokeWidth="1.1"
              strokeDasharray={
                variant === "before" && !failed ? "3 3" : undefined
              }
            />
            {failed && (
              <circle
                cx={(cx + R + n.x - componentRadius) / 2}
                cy={(cy + n.y) / 2}
                r="2.5"
                fill={FAILED}
              />
            )}
          </g>
        );
      })}

      <polygon
        points={hexPoints(cx, cy, R)}
        fill={
          variant === "before" ? "rgba(251,113,133,.14)" : "rgba(52,211,153,.1)"
        }
        stroke={accent}
        strokeWidth="1.4"
      />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fill="#eef2f7"
        fontSize="9.5"
        fontWeight="600"
      >
        {short(system, 14)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={accent} fontSize="8.5">
        {systemState}
      </text>

      {others.map((name, i) => {
        const n = slots[i];
        const failed = variant === "before" && failedComponents.has(name);
        const color = failed ? FAILED : OK;
        const nameLines = wrapSvgLabel(name, 16);
        return (
          <g key={name}>
            <polygon
              points={hexPoints(n.x, n.y, componentRadius)}
              fill={failed ? "rgba(251,191,36,.12)" : "rgba(52,211,153,.07)"}
              stroke={color}
              strokeWidth="1.1"
            />
            <text
              x={n.x}
              y={n.y - (nameLines.length - 1) * 4 + 3}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="8.2"
              fontWeight="600"
              aria-label={name}
            >
              {nameLines.map((line, index) => (
                <tspan key={`${line}-${index}`} x={n.x} dy={index === 0 ? 0 : 8}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- causal chain (right column of section 03) ---------- */

function CausalTree({
  incident,
  activeCauseId,
  onSelect,
}: {
  incident: PublishedIncident;
  activeCauseId: string | null;
  onSelect: (id: string) => void;
}) {
  const tree = incident.root_cause_tree;
  const order = [
    "ROOT_CAUSE",
    "CONTRIBUTING_FACTOR",
    "DIRECT_FAILURE",
    "SYSTEM_IMPACT",
  ];
  const ordered = order.flatMap((t) => tree.filter((n) => n.type === t));
  const seen = new Set(ordered.map((n) => n.id));
  const list = [...ordered, ...tree.filter((n) => !seen.has(n.id))];

  return (
    <ol className="pid-chain" aria-label="Causal chain">
      {list.map((node, i) => {
        const meta =
          causeTypeColors[node.type] ?? causeTypeColors.SYSTEM_IMPACT;
        const isSelected = node.id === activeCauseId;
        const Icon =
          node.type === "ROOT_CAUSE"
            ? AlertTriangleIcon
            : node.type === "CONTRIBUTING_FACTOR"
              ? GitBranchIcon
              : node.type === "DIRECT_FAILURE"
                ? ZapIcon
                : ActivityIcon;
        return (
          <li key={node.id} className="pid-chain-item">
            {i > 0 && (
              <span className="pid-chain-arrow" aria-hidden>
                <ArrowDownIcon size={14} color="#60a5fa" />
              </span>
            )}
            <button
              type="button"
              id={"cause-" + node.id}
              className={"pid-chain-card" + (isSelected ? " is-active" : "")}
              style={{
                ["--cause-color" as string]: meta.color,
                ["--cause-bg" as string]: meta.bg,
                ["--cause-border" as string]: meta.border,
              }}
              aria-pressed={isSelected}
              onClick={() => onSelect(node.id)}
            >
              <span className="pid-chain-icon">
                <Icon color={meta.color} size={15} />
              </span>
              <span className="pid-chain-text">
                <span className="pid-chain-label">{label(node.type)}</span>
                <span className="pid-chain-title">{node.title}</span>
                {node.systemComponent && (
                  <span className="pid-chain-comp">{node.systemComponent}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
