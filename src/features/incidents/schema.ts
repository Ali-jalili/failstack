/** @format */

import { z } from "zod";

export function getSafeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export const officialPostMortemUrlSchema = z
  .string()
  .url("Invalid post-mortem URL")
  .refine((value) => getSafeHttpsUrl(value) !== null, {
    message: "Post-mortem URL must use HTTPS",
  })
  .optional()
  .or(z.literal(""));

// 1. Enums & Primitive Schemas
export const incidentSeveritySchema = z.enum(["CRITICAL", "MAJOR", "MINOR"]);
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;

export const incidentPatternSchema = z.enum([
  "SINGLE_POINT_OF_FAILURE",
  "CASCADING_FAILURE",
  "THUNDERING_HERD",
  "POISON_PILL",
  "RACE_CONDITION",
  "SPLIT_BRAIN",
  "RESOURCE_EXHAUSTION",
]);

export type IncidentPattern = z.infer<typeof incidentPatternSchema>;

export const INCIDENT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  PUBLISHED: "PUBLISHED",
} as const;

export const incidentStatusSchema = z.enum(INCIDENT_STATUS);
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;

export const SUBMITTED_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.PENDING_REVIEW,
  INCIDENT_STATUS.CHANGES_REQUESTED,
  INCIDENT_STATUS.PUBLISHED,
];

export const RESUBMITTABLE_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.DRAFT,
  INCIDENT_STATUS.PENDING_REVIEW,
  INCIDENT_STATUS.CHANGES_REQUESTED,
];

export const DELETABLE_STATUSES: readonly IncidentStatus[] = [
  INCIDENT_STATUS.DRAFT,
  INCIDENT_STATUS.CHANGES_REQUESTED,
];

export const INCIDENT_PATTERN_LABELS: Record<IncidentPattern, string> = {
  SINGLE_POINT_OF_FAILURE: "Single Point of Failure",
  CASCADING_FAILURE: "Cascading Failure",
  THUNDERING_HERD: "Thundering Herd",
  POISON_PILL: "Poison Pill",
  RACE_CONDITION: "Race Condition",
  SPLIT_BRAIN: "Split Brain",
  RESOURCE_EXHAUSTION: "Resource Exhaustion",
};

export const timelineStageSchema = z.enum([
  "TRIGGER",
  "FAILURE",
  "PROPAGATION",
  "IMPACT",
  "DETECTION",
  "MITIGATION",
  "ROOT_CAUSE",
  "PREVENTION",
]);
export type TimelineStage = z.infer<typeof timelineStageSchema>;

export const rootCauseNodeTypeSchema = z.enum([
  "ROOT_CAUSE",
  "CONTRIBUTING_FACTOR",
  "DIRECT_FAILURE",
  "SYSTEM_IMPACT",
]);
export type RootCauseNodeType = z.infer<typeof rootCauseNodeTypeSchema>;

// 2. Component Schemas
export const timelineEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  timestampOffsetMinutes: z
    .number()
    .min(0, "Offset timestamp cannot be negative"),
  stage: timelineStageSchema,
  title: z.string().min(3, "Event title must be at least 3 characters"),
  description: z
    .string()
    .min(5, "Event description must be at least 5 characters"),
  affectedComponent: z.string().min(1, "Affected component name is required"),
  cliCommands: z.array(z.string()).optional(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const rootCauseNodeSchema = z.object({
  id: z.string().min(1, "Node ID is required"),
  parentId: z.string().nullable(),
  type: rootCauseNodeTypeSchema,
  title: z.string().min(3, "Node title must be at least 3 characters"),
  description: z
    .string()
    .min(5, "Node description must be at least 5 characters"),
  systemComponent: z.string().min(1, "System component name is required"),
});
export type RootCauseNode = z.infer<typeof rootCauseNodeSchema>;

export const rootCauseTreeSchema = z
  .array(rootCauseNodeSchema)
  .min(1, "At least one Root Cause Analysis (RCA) node is required")
  .refine(
    (nodes) => nodes.filter((node) => node.parentId === null).length === 1,
    {
      message:
        "The RCA tree must have exactly one root node (parentId === null)",
    },
  );

export const architectureDiffSchema = z
  .object({
    beforeFix: z.string().min(5, "State description before fix is required"),
    afterFix: z.string().min(5, "State description after fix is required"),
    isFact: z.boolean(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Domain Rule: If architecture changes are a Reconstruction (!isFact), reasoning notes are mandatory.
      if (!data.isFact) {
        return !!data.notes && data.notes.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "Notes and reasoning are required when changes are reconstructed (isFact: false)",
      path: ["notes"],
    },
  );
export type ArchitectureDiff = z.infer<typeof architectureDiffSchema>;

export const preventionActionSchema = z.object({
  title: z.string().min(3, "Prevention action title is required"),
  description: z.string().optional(),
});
export type PreventionAction = z.infer<typeof preventionActionSchema>;

export const incidentBasicInfoSchema = z.object({
  title: z.string().min(5, "Incident title must be at least 5 characters"),
  companyName: z.string().min(2, "Company/Organization name is required"),
  occurredAt: z.string().min(1, "Occurrence date is required"),
  durationMinutes: z
    .number()
    .int("Incident duration must be a whole number of minutes")
    .positive("Incident duration must be positive"),
  severity: incidentSeveritySchema,
  pattern: incidentPatternSchema,
  summary: z.string().min(10, "Incident summary must be at least 10 characters"),
  officialPostMortemUrl: officialPostMortemUrlSchema,
});

export const incidentSystemTechnologiesSchema = z.object({
  system: z.string().min(2, "System name is required"),
  technologies: z
    .array(z.string())
    .min(1, "At least one technology must be specified"),
});

const firstTimelineEventAtZero = (data: {
  timeline: { timestampOffsetMinutes: number }[];
}) => data.timeline[0]?.timestampOffsetMinutes === 0;

const firstTimelineEventIsTrigger = (data: {
  timeline: { stage: string }[];
}) => data.timeline[0]?.stage === "TRIGGER";

export const incidentTimelineSchema = z
  .object({
    timeline: z
      .array(timelineEventSchema)
      .min(2, "At least 2 timeline events are required"),
  })
  .refine(firstTimelineEventAtZero, {
    message: "The first timeline event must have a timestamp offset of 0",
    path: ["timeline", 0, "timestampOffsetMinutes"],
  })
  .refine(firstTimelineEventIsTrigger, {
    message: "The first timeline event must have stage TRIGGER",
    path: ["timeline", 0, "stage"],
  });

export const incidentRootCauseArchitectureSchema = z.object({
  rootCauseTree: rootCauseTreeSchema,
  architectureDiff: architectureDiffSchema,
});

export const incidentPreventionSchema = z.object({
  preventionActions: z
    .array(preventionActionSchema)
    .min(1, "At least one prevention action is required"),
});

const incidentContentShape = {
  ...incidentBasicInfoSchema.shape,
  ...incidentSystemTechnologiesSchema.shape,
  ...incidentTimelineSchema.shape,
  ...incidentRootCauseArchitectureSchema.shape,
  ...incidentPreventionSchema.shape,
};

const incidentContentSchema = z.object(incidentContentShape);

// The form schema intentionally accepts a non-empty date string; actions
// validate its ISO format before writing. A persisted incident requires a
// fully valid datetime and server-generated id/slug.
export const incidentFormSchema = incidentContentSchema
  .refine(firstTimelineEventAtZero, {
    message: "The first timeline event must have a timestamp offset of 0",
    path: ["timeline", 0, "timestampOffsetMinutes"],
  })
  .refine(firstTimelineEventIsTrigger, {
    message: "The first timeline event must have stage TRIGGER",
    path: ["timeline", 0, "stage"],
  });

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

export const architectureDiffDraftSchema = z
  .object({
    beforeFix: z
      .string()
      .min(5, "State description before fix is required")
      .nullable()
      .optional(),
    afterFix: z
      .string()
      .min(5, "State description after fix is required")
      .nullable()
      .optional(),
    isFact: z.boolean().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const incidentDraftSchema = z.object({
  ...incidentContentShape,
  durationMinutes: z
    .number()
    .int("Incident duration must be a whole number of minutes"),
  summary: z.string(),
  system: z.string(),
  technologies: z.array(z.string()),
  timeline: z.array(timelineEventSchema),
  rootCauseTree: z.array(rootCauseNodeSchema),
  architectureDiff: architectureDiffDraftSchema,
  preventionActions: z.array(preventionActionSchema),
});

export type IncidentDraftValues = z.infer<typeof incidentDraftSchema>;

export const incidentSchema = z
  .object({
    id: z.string().min(1, "Incident ID is required"),
    slug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase English letters, numbers, and hyphens (-)",
      ),
    ...incidentContentShape,
    occurredAt: z
      .string()
      .datetime({ message: "Invalid occurrence date format" }),
  })
  .refine(firstTimelineEventAtZero, {
    message: "The first timeline event must have a timestamp offset of 0",
    path: ["timeline", 0, "timestampOffsetMinutes"],
  })
  .refine(firstTimelineEventIsTrigger, {
    message: "The stage of the first timeline event must be TRIGGER",
    path: ["timeline", 0, "stage"],
  });

export const incidentRecordSchema = incidentSchema.extend({
  authorId: z.string().min(1, "Author ID is required"),
  status: incidentStatusSchema,
});

export type IncidentSchemaInput = z.infer<typeof incidentSchema>;
export type Incident = z.infer<typeof incidentRecordSchema>;
