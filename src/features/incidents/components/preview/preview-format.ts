/** @format */

/**
 * Small value helpers for the read-only incident preview.
 *
 * The preview must never surface raw `undefined` / `null` / empty strings.
 * These helpers centralize the "show a graceful placeholder or hide the block"
 * decision so every section stays consistent.
 */

import type {
  ArchitectureDiff,
  RootCauseNode,
  TimelineEvent,
} from "@/types/incident";

const NOT_PROVIDED = "Not provided";

/** Trim a value; treat null/undefined/whitespace as empty. */
export function text(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : NOT_PROVIDED;
}

/** Whether a value should be rendered at all (used to hide empty blocks). */
export function hasText(value: string | null | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

/** Render a value or an explicit placeholder when it is empty. */
export function orPlaceholder(
  value: string | null | undefined,
  placeholder = "Not recorded",
): string {
  return hasText(value) ? text(value) : placeholder;
}

/** A short local-date display for the raw `occurredAt` form value. */
export function occurredAtLabel(value: string): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return NOT_PROVIDED;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ---------- timeline ---------- */

export interface PreviewTimelineEvent extends TimelineEvent {
  /** Display clock derived from the occurred-at base + offset. */
  clockLabel: string;
}

function toClockLabel(occurredAt: string, offsetMinutes: number): string {
  const base = new Date((occurredAt ?? "").trim()).getTime();
  if (Number.isNaN(base)) {
    return `T+${offsetMinutes}m`;
  }
  const time = new Date(base + offsetMinutes * 60000);
  if (Number.isNaN(time.getTime())) return `T+${offsetMinutes}m`;
  return time.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Sort timeline events by offset and attach a readable clock label to each.
 * Reads the raw form state (camelCase) directly — no schema change.
 */
export function toPreviewTimeline(
  events: TimelineEvent[],
  occurredAt: string,
): PreviewTimelineEvent[] {
  return [...events]
    .sort((a, b) => a.timestampOffsetMinutes - b.timestampOffsetMinutes)
    .map((event) => ({
      ...event,
      clockLabel: toClockLabel(occurredAt, event.timestampOffsetMinutes),
    }));
}

/* ---------- root-cause tree ---------- */

export interface PreviewRootCauseNode extends RootCauseNode {
  depth: number;
}

function parentMap(nodes: RootCauseNode[]): Map<string, RootCauseNode> {
  return new Map(nodes.map((node) => [node.id, node]));
}

function depthOf(
  node: RootCauseNode,
  byId: Map<string, RootCauseNode>,
): number {
  let depth = 0;
  let parentId = node.parentId;
  const seen = new Set<string>([node.id]);
  // Bounded by the node count and a cycle guard, so a malformed tree cannot
  // loop forever.
  while (parentId !== null && depth < byId.size) {
    const parent = byId.get(parentId);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    depth += 1;
    parentId = parent.parentId;
  }
  return depth;
}

/**
 * Compute a shallow depth for every node so the preview can render the tree
 * as an indented list without duplicating the SVG renderer.
 */
export function toPreviewRootCauseTree(
  nodes: RootCauseNode[],
): PreviewRootCauseNode[] {
  const byId = parentMap(nodes);
  return nodes.map((node) => ({
    ...node,
    depth: depthOf(node, byId),
  }));
}

/* ---------- architecture ---------- */

export interface PreviewArchitecture extends ArchitectureDiff {
  isFact: boolean;
  hasContent: boolean;
  hasNotes: boolean;
}

export function toPreviewArchitecture(
  diff: ArchitectureDiff,
): PreviewArchitecture {
  return {
    ...diff,
    hasContent: hasText(diff.beforeFix) || hasText(diff.afterFix),
    hasNotes: hasText(diff.notes),
  };
}
