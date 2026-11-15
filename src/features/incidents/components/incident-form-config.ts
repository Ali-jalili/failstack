import type { StepDefinition } from "./Steps";
import type { IncidentFormValues } from "@/features/incidents/form-schema";
import BasicInfoStep from "./BasicInfoStep";
import SystemTechnologiesStep from "./SystemTechnologiesStep";
import TimelineStep from "./TimelineStep";
import RootCauseArchitectureStep from "./RootCauseArchitectureStep";
import PreventionReviewStep from "./PreventionReviewStep";
import PreviewStep from "./PreviewStep";
export const STEPS: readonly StepDefinition<IncidentFormValues>[] = [
  {
    id: "basic-info",
    label: "Basic info",
    description: "Essential metadata and initial impact",
    component: BasicInfoStep,
    fields: [
      "title",
      "companyName",
      "occurredAt",
      "durationMinutes",
      "severity",
      "pattern",
      "summary",
      "officialPostMortemUrl",
    ],
  },
  {
    id: "system-technologies",
    label: "System & technologies",
    description: "The system and stack involved",
    component: SystemTechnologiesStep,
    fields: ["system", "technologies"],
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Sequence of events from trigger to mitigation",
    component: TimelineStep,
    fields: ["timeline"],
  },
  {
    id: "root-cause",
    label: "Root cause & architecture",
    description: "Why it happened and what changed",
    component: RootCauseArchitectureStep,
    fields: ["rootCauseTree", "architectureDiff"],
  },
  {
    id: "prevention",
    label: "Prevention & review",
    description: "Concrete changes to stop it recurring",
    component: PreventionReviewStep,
    fields: ["preventionActions"],
  },
  {
    // Read-only final review. It has no fields to validate of its own; it is
    // only reachable after the data-entry steps (above) have validated. The
    // submit button appears on this step (isLast).
    id: "preview",
    label: "Final preview",
    description: "Review the complete report before submitting",
    component: PreviewStep,
    fields: [],
  },
] as const;

export const DEFAULT_VALUES: IncidentFormValues = {
  title: "",
  companyName: "",
  occurredAt: "",
  durationMinutes: 0,
  severity: "MINOR",
  pattern: "SINGLE_POINT_OF_FAILURE",
  summary: "",
  officialPostMortemUrl: "",
  system: "",
  technologies: [],
  timeline: [],
  rootCauseTree: [],
  architectureDiff: {
    beforeFix: "",
    afterFix: "",
    isFact: true,
    notes: "",
  },
  preventionActions: [],
};

export function toIsoFromLocalDateTime(value: string): string | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
    match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(fraction.padEnd(3, "0")),
  };
  const localDate = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );

  if (
    localDate.getFullYear() !== parts.year ||
    localDate.getMonth() !== parts.month - 1 ||
    localDate.getDate() !== parts.day ||
    localDate.getHours() !== parts.hour ||
    localDate.getMinutes() !== parts.minute ||
    localDate.getSeconds() !== parts.second ||
    localDate.getMilliseconds() !== parts.millisecond
  ) {
    return null;
  }

  return localDate.toISOString();
}

