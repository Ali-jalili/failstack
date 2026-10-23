"use client";

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
