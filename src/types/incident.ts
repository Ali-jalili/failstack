/** @format */

export type IncidentSeverity = "CRITICAL" | "MAJOR" | "MINOR";

export type IncidentPattern =
  | "SINGLE_POINT_OF_FAILURE"
  | "CASCADING_FAILURE"
  | "THUNDERING_HERD"
  | "POISON_PILL"
  | "RACE_CONDITION"
  | "SPLIT_BRAIN"
  | "RESOURCE_EXHAUSTION";

export type TimelineStage =
  | "TRIGGER"
  | "FAILURE"
  | "PROPAGATION"
  | "IMPACT"
  | "DETECTION"
  | "MITIGATION"
  | "ROOT_CAUSE"
  | "PREVENTION";

export type RootCauseNodeType =
  | "ROOT_CAUSE"
  | "CONTRIBUTING_FACTOR"
  | "DIRECT_FAILURE"
  | "SYSTEM_IMPACT";

export const INCIDENT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  PUBLISHED: "PUBLISHED",
} as const;

export type IncidentStatus = (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];

export const SUBMITTED_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.PENDING_REVIEW,
  INCIDENT_STATUS.CHANGES_REQUESTED,
  INCIDENT_STATUS.PUBLISHED,
];

// Statuses in which the author may still resubmit the report.
export const RESUBMITTABLE_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.DRAFT,
  INCIDENT_STATUS.PENDING_REVIEW,
  INCIDENT_STATUS.CHANGES_REQUESTED,
];

// Statuses in which the author may delete the report.
export const DELETABLE_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.DRAFT,
  INCIDENT_STATUS.CHANGES_REQUESTED,
];
export interface TimelineEvent {
  id: string;
  timestampOffsetMinutes: number;
  stage: TimelineStage;
  title: string;
  description: string;
  affectedComponent: string;
  cliCommands?: string[];
}

export interface RootCauseNode {
  id: string;
  parentId: string | null;
  type: RootCauseNodeType;
  title: string;
  description: string;
  systemComponent: string;
}

export interface ArchitectureDiff {
  beforeFix: string;
  afterFix: string;
  isFact: boolean;
  notes?: string;
}

export interface PreventionAction {
  title: string;
  description?: string;
}

export interface Incident {
  id: string;
  authorId: string;
  status: IncidentStatus;
  slug: string;
  title: string;
  companyName: string;
  occurredAt: string;
  durationMinutes: number;
  severity: IncidentSeverity;
  pattern: IncidentPattern;
  summary: string;
  officialPostMortemUrl?: string;

  system: string;
  technologies: string[];

  timeline: TimelineEvent[];
  rootCauseTree: RootCauseNode[];
  architectureDiff: ArchitectureDiff;
  preventionActions: PreventionAction[];
}
