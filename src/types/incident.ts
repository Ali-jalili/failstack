/** @format */

// Keep this path as a compatibility barrel while the schema module owns the
// runtime definitions and inferred domain types.
export {
  DELETABLE_STATUSES,
  INCIDENT_STATUS,
  RESUBMITTABLE_STATUSES,
  SUBMITTED_STATUSES,
} from "@/features/incidents/schema";

export type {
  ArchitectureDiff,
  Incident,
  IncidentPattern,
  IncidentSchemaInput,
  IncidentSeverity,
  IncidentStatus,
  PreventionAction,
  RootCauseNode,
  RootCauseNodeType,
  TimelineEvent,
  TimelineStage,
} from "@/features/incidents/schema";
