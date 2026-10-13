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

export type IncidentStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED";
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
