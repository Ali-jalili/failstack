"use client";

import { GitCommit } from "lucide-react";
import type { ReviewIncident } from "@/features/review/server/queries";

/* ---------- Architecture Diff (SVG before/after) ---------- */

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
