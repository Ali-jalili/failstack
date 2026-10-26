/** @format */

"use client";

/*
 * Icon factories for the public incident report page.
 *
 * Two families, kept together because both are used by
 * `PublicIncidentDetail`:
 *  - `wrapIcon`-based icons: usable both in HTML and embedded inside <svg>
 *    (they accept x/y and render a <g transform="translate(...)">).
 *  - `Ico`-based icons: small inline HTML glyphs.
 *
 * This module is a pure asset collection: it imports nothing from the
 * feature, so it cannot create circular dependencies.
 */

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

export function AlertTriangleIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>,
    p,
  );
}

export function CheckCircleIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </>,
    p,
  );
}

export function GitBranchIcon(p: IconProps) {
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

export function ZapIcon(p: IconProps) {
  return wrapIcon(
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    p,
  );
}

export function ActivityIcon(p: IconProps) {
  return wrapIcon(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />, p);
}

export function ArrowDownIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>,
    p,
  );
}

export function GitCommitIcon(p: IconProps) {
  return wrapIcon(
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" x2="7" y1="12" y2="12" />
      <line x1="17.05" x2="23" y1="12" y2="12" />
    </>,
    p,
  );
}

export function Code2Icon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </>,
    p,
  );
}

export function ScrollTextIcon(p: IconProps) {
  return wrapIcon(
    <>
      <path d="M15 12h-5" />
      <path d="M15 8h-5" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H8a2 2 0 0 1-2-2V5a2 2 0 0 0-2 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
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

export function CalendarIcon() {
  return (
    <Ico>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Ico>
  );
}

export function TimerIcon() {
  return (
    <Ico>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </Ico>
  );
}

export function WaypointsIcon() {
  return (
    <Ico>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </Ico>
  );
}

export function LayersIcon() {
  return (
    <Ico>
      <path d="m12.83 2.18 6.57 3.75a2 2 0 0 1 0 3.46l-6.57 3.79a2 2 0 0 1-2 0L4.26 9.38a2 2 0 0 1 0-3.46L10.83 2.18a2 2 0 0 1 2 0Z" />
      <path d="m4.26 14.62 6.57 3.79a2 2 0 0 0 2 0l6.57-3.79" />
    </Ico>
  );
}

export function ServerIcon() {
  return (
    <Ico>
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </Ico>
  );
}

export function ClockIcon() {
  return (
    <Ico size={22}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Ico>
  );
}
