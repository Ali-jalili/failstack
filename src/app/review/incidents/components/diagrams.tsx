/** @format */

"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  GitBranch,
  GitCommit,
  Network,
  Shield,
  Target,
  Timer,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { ReviewIncident } from "@/features/review/server/queries";
import type {
  IncidentPattern,
  IncidentSeverity,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";

/* ---------- shared helpers ---------- */

export const severityMeta: Record<
  IncidentSeverity,
  { label: string; text: string; bg: string; dot: string }
> = {
  CRITICAL: {
    label: "Critical",
    text: "text-rose-300",
    bg: "bg-rose-500/15 border-rose-500/30",
    dot: "bg-rose-400",
  },
  MAJOR: {
    label: "Major",
    text: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/30",
    dot: "bg-amber-400",
  },
  MINOR: {
    label: "Minor",
    text: "text-[#c6e47c]",
    bg: "bg-[#c6e47c]/10 border-[#c6e47c]/25",
    dot: "bg-[#c6e47c]",
  },
};

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function patternLabel(value: IncidentPattern | string) {
  switch (value as IncidentPattern) {
    case "SINGLE_POINT_OF_FAILURE":
      return "Single Point of Failure";
    case "CASCADING_FAILURE":
      return "Cascading Failure";
    case "THUNDERING_HERD":
      return "Thundering Herd";
    case "POISON_PILL":
      return "Poison Pill";
    case "RACE_CONDITION":
      return "Race Condition";
    case "SPLIT_BRAIN":
      return "Split-Brain";
    case "RESOURCE_EXHAUSTION":
      return "Resource Exhaustion";
    default:
      return formatLabel(value);
  }
}

const stageIcons: Record<TimelineEvent["stage"], LucideIcon> = {
  TRIGGER: AlertTriangle,
  FAILURE: Circle,
  PROPAGATION: Network,
  IMPACT: Shield,
  DETECTION: Target,
  MITIGATION: GitBranch,
  ROOT_CAUSE: Waypoints,
  PREVENTION: CheckCircle2,
};

const stageColors: Record<TimelineEvent["stage"], string> = {
  TRIGGER: "#c6e47c",
  FAILURE: "#3b82f6",
  PROPAGATION: "#f43f5e",
  IMPACT: "#f43f5e",
  DETECTION: "#3b82f6",
  MITIGATION: "#8b5cf6",
  ROOT_CAUSE: "#c6e47c",
  PREVENTION: "#94a3b8",
};

export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#c6e47c]/25 bg-[#c6e47c]/10">
          <Icon className="h-3.5 w-3.5 text-[#c6e47c]" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {trailing}
    </div>
  );
}

/* ---------- 01 · Incident Timeline (horizontal) ---------- */

export function IncidentTimeline({
  events,
  stageMeta,
}: {
  events: TimelineEvent[];
  stageMeta?: string;
}) {
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => a.timestampOffsetMinutes - b.timestampOffsetMinutes,
      ),
    [events],
  );
  const [activeId, setActiveId] = useState(sorted[0]?.id ?? null);
  const active = sorted.find((e) => e.id === activeId) ?? sorted[0];

  if (!active) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No timeline events were submitted.
      </p>
    );
  }

  const ActiveIcon = stageIcons[active.stage] ?? Circle;
  const activeColor = stageColors[active.stage] ?? "#c6e47c";

  return (
    <div className="mt-8">
      {/* horizontal timeline */}
      <div className="review-timeline-track pb-1">
        <ol
          aria-label="Incident events in chronological order"
          className="relative flex w-full min-w-0 items-start gap-0"
        >
          {sorted.map((event, i) => {
            const Icon = stageIcons[event.stage] ?? Circle;
            const color = stageColors[event.stage] ?? "#94a3b8";
            const isActive = event.id === active.id;
            const isLast = i === sorted.length - 1;

            return (
              <li
                key={event.id}
                className="relative flex min-w-0 flex-1 flex-col items-center"
              >
                <div className="relative z-10 flex w-full items-center justify-center  mt-1.5">
                  {!isLast && (
                    <span
                      aria-hidden
                      className="review-timeline-connector absolute left-1/2 top-1/2 h-px -translate-y-1/2"
                      style={{
                        width: "100%",
                        background: `linear-gradient(90deg, ${color}aa, ${stageColors[sorted[i + 1].stage] ?? "#94a3b8"}aa)`,
                      }}
                    />
                  )}
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(event.id)}
                    className={`group relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#0b111b] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] ${
                      isActive
                        ? "scale-110 shadow-[0_0_0_4px_rgba(198,228,124,0.15)]"
                        : "hover:scale-105"
                    }`}
                    style={{
                      borderColor: color,
                      boxShadow: isActive ? `0 0 18px ${color}44` : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} aria-hidden />
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-full opacity-20 motion-reduce:animate-none"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                </div>

                <div className="mt-3 w-full min-w-0 px-1 text-center">
                  <p
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive ? "font-semibold" : "text-slate-500"
                    }`}
                    style={isActive ? { color } : undefined}
                  >
                    T+{event.timestampOffsetMinutes}m
                  </p>
                  <p
                    className={`review-timeline-stage mt-0.5 text-[11px] font-medium ${
                      isActive ? "text-slate-200" : "text-slate-400"
                    }`}
                  >
                    {formatLabel(event.stage)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* detail card */}
      <article
        key={active.id}
        aria-live="polite"
        className="review-selection-enter mt-5 rounded-md border border-slate-800 bg-[#0b111b]/80 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]"
            style={{
              color: activeColor,
              borderColor: `${activeColor}55`,
              backgroundColor: `${activeColor}14`,
            }}
          >
            <ActiveIcon className="h-3 w-3" aria-hidden />
            T+{active.timestampOffsetMinutes}m · {formatLabel(active.stage)}
          </span>
          <h4 className="min-w-0 flex-1 break-words text-base font-medium text-slate-100 sm:text-lg">
            {active.title}
          </h4>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
          {active.description}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800/80 pt-3 text-[11px]">
          <div>
            <dt className="inline text-slate-500">Affected component </dt>
            <dd className="inline text-slate-300">
              {active.affectedComponent}
            </dd>
          </div>
          {stageMeta && (
            <div>
              <dt className="inline text-slate-500">Stage </dt>
              <dd className="inline text-slate-300">{stageMeta}</dd>
            </div>
          )}
        </dl>

        {active.cliCommands && active.cliCommands.length > 0 && (
          <details className="group mt-4 border-t border-slate-800 pt-3">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-300">
              Inspect {active.cliCommands.length} command
              {active.cliCommands.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-2">
              {active.cliCommands.map((cmd, i) => (
                <li key={i}>
                  <pre className="overflow-x-auto border-l-2 border-[#c6e47c]/40 bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-[#c6e47c]">
                    {cmd}
                  </pre>
                </li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </div>
  );
}

/* ---------- 02 · Root Cause Diagram (SVG tree) ---------- */

const nodeTypeMeta: Record<
  RootCauseNode["type"],
  { label: string; color: string }
> = {
  ROOT_CAUSE: { label: "Root Cause", color: "#f43f5e" },
  CONTRIBUTING_FACTOR: { label: "Contributing Factor", color: "#f59e0b" },
  DIRECT_FAILURE: { label: "Direct Failure", color: "#8b5cf6" },
  SYSTEM_IMPACT: { label: "System Impact", color: "#94a3b8" },
};

export function RootCauseDiagram({ nodes }: { nodes: RootCauseNode[] }) {
  const [activeId, setActiveId] = useState(
    nodes.find((n) => n.type === "ROOT_CAUSE")?.id ?? nodes[0]?.id ?? null,
  );

  const { disconnected } = useMemo(() => {
    const byParent = new Map<string | null, RootCauseNode[]>();
    for (const n of nodes) {
      const list = byParent.get(n.parentId) ?? [];
      list.push(n);
      byParent.set(n.parentId, list);
    }
    const roots = byParent.get(null) ?? [];
    const visited = new Set<string>();

    function collect(list: RootCauseNode[]) {
      for (const node of list) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        collect(byParent.get(node.id) ?? []);
      }
    }

    collect(roots);
    return { disconnected: nodes.filter((n) => !visited.has(n.id)) };
  }, [nodes]);

  const active = nodes.find((n) => n.id === activeId) ?? nodes[0];

  /* Build a layered layout for the tree using absolute coordinates */
  const layout = useMemo(() => {
    const byParent = new Map<string | null, RootCauseNode[]>();
    for (const n of nodes) {
      const list = byParent.get(n.parentId) ?? [];
      list.push(n);
      byParent.set(n.parentId, list);
    }

    const NODE_W = 148;
    const NODE_H = 54;
    const GAP_X = 24;
    const GAP_Y = 56;
    const PAD = 16;

    /* Subtree width, with cycle guard so bad data cannot hang the page */
    const widthOf = new Map<string, number>();
    const measuring = new Set<string>();

    function subtreeWidth(id: string): number {
      const cached = widthOf.get(id);
      if (cached !== undefined) return cached;
      if (measuring.has(id)) return NODE_W; // cycle → treat as leaf
      measuring.add(id);
      const children = byParent.get(id) ?? [];
      let w = NODE_W;
      if (children.length > 0) {
        w =
          children.reduce((acc, c) => acc + subtreeWidth(c.id) + GAP_X, 0) -
          GAP_X;
        w = Math.max(w, NODE_W);
      }
      measuring.delete(id);
      widthOf.set(id, w);
      return w;
    }

    /* Place every node at absolute coordinates, centered above its children */
    const positions = new Map<string, { x: number; y: number }>();

    function place(id: string, left: number, depth: number) {
      const w = subtreeWidth(id);
      positions.set(id, { x: left + w / 2, y: PAD + depth * (NODE_H + GAP_Y) });
      const children = byParent.get(id) ?? [];
      if (children.length === 0) return;

      const block =
        children.reduce((acc, c) => acc + subtreeWidth(c.id) + GAP_X, 0) -
        GAP_X;
      let cursor = left + (w - block) / 2;
      for (const child of children) {
        const cw = subtreeWidth(child.id);
        place(child.id, cursor, depth + 1);
        cursor += cw + GAP_X;
      }
    }

    const roots = byParent.get(null) ?? [];
    let cursor = PAD;
    for (const root of roots) {
      place(root.id, cursor, 0);
      cursor += subtreeWidth(root.id) + GAP_X * 2;
    }

    let totalWidth = PAD * 2;
    let totalHeight = PAD * 2;
    for (const p of positions.values()) {
      totalWidth = Math.max(totalWidth, p.x + NODE_W / 2 + PAD);
      totalHeight = Math.max(totalHeight, p.y + NODE_H + PAD);
    }
    totalWidth = Math.max(totalWidth, 300);

    if (positions.size > 0) {
      const left = Math.min(...[...positions.values()].map((p) => p.x - NODE_W / 2));
      const right = Math.max(...[...positions.values()].map((p) => p.x + NODE_W / 2));
      const offsetX = (totalWidth - (right - left)) / 2 - left;
      if (offsetX > 0) {
        for (const [id, position] of positions) {
          positions.set(id, { ...position, x: position.x + offsetX });
        }
      }
    }

    return { positions, NODE_W, NODE_H, totalWidth, totalHeight };
  }, [nodes]);

  const { positions, NODE_W, NODE_H, totalWidth, totalHeight } = layout;

  const edges = useMemo(() => {
    const out: { from: string; to: string }[] = [];
    for (const n of nodes) {
      if (n.parentId) out.push({ from: n.parentId, to: n.id });
    }
    return out;
  }, [nodes]);

  const activeMeta = active ? nodeTypeMeta[active.type] : null;

  return (
    <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(15rem,1fr)]">
      {/* diagram */}
      <div className="review-root-diagram min-w-0 overflow-hidden rounded-md border border-slate-800 bg-[#0b111b]/60 p-2">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full max-w-full"
          role="img"
          aria-label="Root cause diagram"
        >
          {/* edges */}
          {edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x;
            const y1 = from.y + NODE_H;
            const x2 = to.x;
            const y2 = to.y;
            const midY = (y1 + y2) / 2;
            const isHot =
              activeId !== null &&
              (edge.from === activeId || edge.to === activeId);
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke={isHot ? "#c6e47c" : "#334155"}
                strokeWidth={isHot ? 1.5 : 1}
                strokeDasharray={isHot ? "none" : "3 3"}
                opacity={isHot ? 0.9 : 0.6}
              />
            );
          })}

          {/* nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const meta = nodeTypeMeta[node.type];
            const isActive = node.id === activeId;
            const x = pos.x - NODE_W / 2;
            const y = pos.y;

            return (
              <g
                key={node.id}
                onClick={() => setActiveId(node.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`${meta.label}: ${node.title}`}
              >
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill={isActive ? `${meta.color}1f` : "#0d1522"}
                  stroke={isActive ? meta.color : "#1e293b"}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                <circle
                  cx={x + 12}
                  cy={y + NODE_H / 2}
                  r={4}
                  fill={meta.color}
                />
                <text
                  x={x + 22}
                  y={y + 18}
                  fill={meta.color}
                  fontSize={8}
                  fontFamily="monospace"
                  className="uppercase"
                >
                  {meta.label.slice(0, 18)}
                </text>
                <text
                  x={x + 22}
                  y={y + 32}
                  fill={isActive ? "#e8ece4" : "#cbd5e1"}
                  fontSize={10}
                  fontWeight={isActive ? 600 : 400}
                >
                  {node.title.length > 18
                    ? node.title.slice(0, 18) + "…"
                    : node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* detail panel */}
      {active && activeMeta && (
        <aside className="rounded-md border border-slate-800 bg-[#0b111b]/80 p-4">
          <p
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: activeMeta.color }}
          >
            {activeMeta.label}
          </p>
          <h4 className="mt-2 break-words text-base font-medium text-slate-100">
            {active.title}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {active.systemComponent}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
            {active.description}
          </p>
        </aside>
      )}

      {disconnected.length > 0 && (
        <div className="xl:col-span-2">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
            Unlinked entries
          </p>
          <div className="flex flex-wrap gap-2">
            {disconnected.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className="rounded-sm border border-slate-700 bg-[#0d1522] px-3 py-1.5 text-xs text-slate-300 hover:border-[#c6e47c]/50 hover:text-[#c6e47c]"
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: nodeTypeMeta[n.type].color }}
                />
                {n.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 03 · Architecture Diff (SVG before/after) ---------- */

export function ArchitectureDiffDiagram({
  incident,
}: {
  incident: ReviewIncident;
}) {
  const arch = incident.architecture_diff;

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <ArchPanel
        label="Before"
        tone="rose"
        title={arch.beforeFix}
        note="Previous configuration"
      />
      <ArchPanel
        label="After"
        tone="lime"
        title={arch.afterFix}
        note={arch.notes ?? "Restored / corrected configuration"}
      />

      <div className="lg:col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-slate-800 bg-[#0b111b]/60 px-4 py-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-slate-500" />
          Normal path
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-5 border-t-2 border-dashed border-rose-400" />
          Failing / timeout path
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] ${
            arch.isFact
              ? "border-[#c6e47c]/25 bg-[#c6e47c]/10 text-[#c6e47c]"
              : "border-amber-500/25 bg-amber-500/10 text-amber-300"
          }`}
        >
          <GitCommit className="h-3 w-3" aria-hidden />
          {arch.isFact ? "Verified fact" : "Inferred"}
        </span>
      </div>
    </div>
  );
}

function ArchPanel({
  label,
  tone,
  title,
  note,
}: {
  label: string;
  tone: "rose" | "lime";
  title: string;
  note: string;
}) {
  const color = tone === "rose" ? "#fb7185" : "#c6e47c";

  return (
    <div className="rounded-md border border-slate-800 bg-[#0b111b]/80 p-4">
      <p
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {label}
      </p>
      <h4 className="mt-2 text-sm font-medium leading-snug text-slate-100">
        {title}
      </h4>
      <p className="mt-1 text-xs text-slate-500">{note}</p>

      {/* minimal service diagram */}
      <svg
        viewBox="0 0 260 84"
        className="mt-4 h-auto w-full"
        role="img"
        aria-label={`${label} architecture`}
      >
        <ServiceNode x={10} y={26} w={54} label="Client" color="#94a3b8" />
        <ServiceNode x={90} y={26} w={54} label="Gateway" color={color} />
        <ServiceNode
          x={170}
          y={26}
          w={60}
          label="Payment"
          color={color}
          highlight
        />
        {/* arrows */}
        <line x1={64} y1={42} x2={90} y2={42} stroke="#475569" />
        <polygon points="90,42 84,39 84,45" fill="#475569" />
        <line
          x1={144}
          y1={42}
          x2={170}
          y2={42}
          stroke={tone === "rose" ? "#fb7185" : "#c6e47c"}
          strokeDasharray={tone === "rose" ? "4 3" : "none"}
        />
        <polygon
          points="170,42 164,39 164,45"
          fill={tone === "rose" ? "#fb7185" : "#c6e47c"}
        />
        {/* downstream */}
        <ServiceNode x={170} y={58} w={60} label="DB" color="#475569" small />
        <line
          x1={200}
          y1={58}
          x2={200}
          y2={62}
          stroke="#475569"
          strokeDasharray="2 2"
        />
      </svg>
    </div>
  );
}

function ServiceNode({
  x,
  y,
  w,
  label,
  color,
  highlight,
  small,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  color: string;
  highlight?: boolean;
  small?: boolean;
}) {
  const h = small ? 16 : 30;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={highlight ? `${color}1a` : "#0d1522"}
        stroke={highlight ? color : "#334155"}
        strokeWidth={highlight ? 1.2 : 1}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 3}
        textAnchor="middle"
        fill={highlight ? color : "#cbd5e1"}
        fontSize={small ? 8 : 10}
        fontWeight={highlight ? 600 : 400}
      >
        {label}
      </text>
    </g>
  );
}

/* ---------- 04 · Prevention actions ---------- */

export function PreventionList({
  actions,
}: {
  actions: ReviewIncident["prevention_actions"];
}) {
  if (actions.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No prevention actions were submitted.
      </p>
    );
  }

  return (
    <ol className="mt-5 grid gap-3 sm:grid-cols-2">
      {actions.map((action, i) => (
        <li
          key={i}
          className="rounded-md border border-slate-800 bg-[#0b111b]/70 p-4 transition-colors hover:border-[#c6e47c]/40"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#c6e47c]/25 bg-[#c6e47c]/10 font-mono text-[11px] font-semibold text-[#c6e47c]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h4 className="break-words text-sm font-medium text-slate-100">
                {action.title}
              </h4>
              {action.description && (
                <p className="mt-1.5 break-words text-xs leading-5 text-slate-400">
                  {action.description}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Progress ring (sections completed) ---------- */

export function ProgressRing({
  value,
  total,
  size = 56,
  label,
}: {
  value: number;
  total: number;
  size?: number;
  label?: string;
}) {
  const radius = size / 2 - 4;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#c6e47c"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-semibold tabular-nums text-slate-200">
        {value}
        <span className="text-slate-500">/{total}</span>
      </span>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

/* ---------- Facts bar ---------- */

export function IncidentFactsBar({ incident }: { incident: ReviewIncident }) {
  const facts = [
    {
      icon: Clock,
      label: "Incident time",
      value: `${formatDate(incident.occurred_at)} UTC`,
    },
    {
      icon: Timer,
      label: "Duration",
      value: `${incident.duration_minutes} minutes`,
    },
    {
      icon: Waypoints,
      label: "Pattern",
      value: patternLabel(incident.pattern),
    },
    {
      icon: Cpu,
      label: "Technologies",
      value: incident.technologies.join(" · ") || "—",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {facts.map((f) => (
        <div
          key={f.label}
          className="rounded-md border border-slate-800 bg-[#0b111b]/60 p-3"
        >
          <div className="flex items-center gap-2">
            <f.icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
              {f.label}
            </dt>
          </div>
          <dd className="mt-1.5 break-words text-xs text-slate-300">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export { GitBranch, GitCommit, Shield, Target };
