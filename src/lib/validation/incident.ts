/** @format */

import { z } from "zod";

// 1. Enums & Primitive Schemas
export const incidentSeveritySchema = z.enum(["CRITICAL", "MAJOR", "MINOR"]);

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

export const rootCauseNodeTypeSchema = z.enum([
  "ROOT_CAUSE",
  "CONTRIBUTING_FACTOR",
  "DIRECT_FAILURE",
  "SYSTEM_IMPACT",
]);

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

export const preventionActionSchema = z.object({
  title: z.string().min(3, "Prevention action title is required"),
  description: z.string().optional(),
});

// 3. Main Incident Schema with Domain Rules Validation
export const incidentSchema = z
  .object({
    id: z.string().min(1, "Incident ID is required"),
    slug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase English letters, numbers, and hyphens (-)",
      ),
    title: z.string().min(5, "Incident title must be at least 5 characters"),
    companyName: z.string().min(2, "Company/Organization name is required"),
    occurredAt: z
      .string()
      .datetime({ message: "Invalid occurrence date format" }),
    durationMinutes: z.number().positive("Incident duration must be positive"),
    severity: incidentSeveritySchema,
    pattern: incidentPatternSchema,
    summary: z
      .string()
      .min(10, "Incident summary must be at least 10 characters"),
    officialPostMortemUrl: z
      .string()
      .url("Invalid post-mortem URL")
      .optional()
      .or(z.literal("")),
    system: z.string().min(2, "System name is required"),
    technologies: z
      .array(z.string())
      .min(1, "At least one technology must be specified"),
    timeline: z
      .array(timelineEventSchema)
      .min(2, "At least 2 events are required to form a valid timeline"),
    rootCauseTree: z
      .array(rootCauseNodeSchema)
      .min(1, "At least one Root Cause Analysis (RCA) node is required"),
    architectureDiff: architectureDiffSchema,
    preventionActions: z
      .array(preventionActionSchema)
      .min(1, "At least one prevention action is required"),
  })
  // Timeline Domain Rules Validation
  .refine(
    (data) => {
      const firstEvent = data.timeline[0];
      return firstEvent && firstEvent.timestampOffsetMinutes === 0;
    },
    {
      message: "The first timeline event must have a timestamp offset of 0",
      path: ["timeline", 0, "timestampOffsetMinutes"],
    },
  )
  .refine(
    (data) => {
      const firstEvent = data.timeline[0];
      return firstEvent && firstEvent.stage === "TRIGGER";
    },
    {
      message: "The stage of the first timeline event must be TRIGGER",
      path: ["timeline", 0, "stage"],
    },
  )
  // RCA Tree Domain Rules Validation
  .refine(
    (data) => {
      const rootNodes = data.rootCauseTree.filter(
        (node) => node.parentId === null,
      );
      return rootNodes.length === 1;
    },
    {
      message:
        "The RCA tree must have exactly one root node (parentId === null)",
      path: ["rootCauseTree"],
    },
  );

// Infer TypeScript type from Zod schema
export type IncidentSchemaInput = z.infer<typeof incidentSchema>;
