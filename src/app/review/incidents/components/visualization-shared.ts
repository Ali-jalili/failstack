/** @format */

"use client";

import type { IncidentPattern, IncidentSeverity } from "@/types/incident";

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
