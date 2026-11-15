import { formatDate } from "./visualization-shared";
export type SeverityKey = "CRITICAL" | "MAJOR" | "MINOR";
export type SortKey = "default" | "priority" | "newest" | "oldest";
export type ServiceFilter = string; // "ALL" or a system name

export const SEVERITIES: SeverityKey[] = ["CRITICAL", "MAJOR", "MINOR"];
export const SEVERITY_RANK: Record<SeverityKey, number> = {
  CRITICAL: 0,
  MAJOR: 1,
  MINOR: 2,
};

/** Solid accent colors for severity dots, badges, and bars. */
export const severityColor: Record<SeverityKey, string> = {
  CRITICAL: "#fb7185",
  MAJOR: "#fcd34d",
  MINOR: "#a3e635",
};

/* ---------- helpers ---------- */

/**
 * The dedicated review workspace: every pending incident rendered as a
 * compact, scannable row inside a two-column layout (queue + context
 * panels). All summary metrics and signals are derived from the real
 * queue data passed in by the server — nothing is fabricated.
 */

/** Relative, human-friendly time ("just now", "3h ago", "5d ago"). */
export function relativeTime(value: string, now = Date.now()): string {
  const then = Date.parse(value);
  if (Number.isNaN(then)) return formatDate(value);
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Initials for the reporter badge, falling back to email. */
export function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`
      : source.slice(0, 2);
  return letters ? letters.toUpperCase() : "?";
}

/** Normalised service key for grouping; safe when system is empty. */
