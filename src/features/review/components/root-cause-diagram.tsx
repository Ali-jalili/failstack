"use client";

import { useMemo, useState } from "react";
import type { RootCauseNode } from "@/types/incident";

/* ---------- Root Cause Diagram (SVG tree) ---------- */

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
