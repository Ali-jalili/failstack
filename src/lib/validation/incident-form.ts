/** @format */

import { z } from "zod";

import {
  architectureDiffSchema,
  incidentPatternSchema,
  incidentSeveritySchema,
  preventionActionSchema,
  rootCauseNodeSchema,
  timelineEventSchema,
} from "./incident";

//?? Schema Step 1

export const incidentBasicInfoSchema = z.object({
  title: z.string().min(5, "Incident title must be at least 5 characters"),

  companyName: z.string().min(2, "Company/Organization name is required"),

  occurredAt: z.string().min(1, "Occurrence date is required"),

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
});

//?? Schema Step 2

export const incidentSystemTechnologiesSchema = z.object({
  system: z.string().min(2, "System name is required"),

  technologies: z
    .array(z.string())
    .min(1, "At least one technology must be specified"),
});

//?? Schema Step 3
export const incidentTimelineSchema = z.object({
  timeline: z.array(timelineEventSchema).min(2),
});

//?? Schema Step 4

export const incidentRootCauseArchitectureSchema = z.object({
  rootCauseTree: z
    .array(rootCauseNodeSchema)
    .min(1, "At least one Root Cause Analysis (RCA) node is required"),

  architectureDiff: architectureDiffSchema,
});

//?? Schema Step 5
export const incidentPreventionSchema = z.object({
  preventionActions: z
    .array(preventionActionSchema)
    .min(1, "At least one prevention action is required"),
});

//?? FormSchema

export const incidentFormSchema = z.object({
  ...incidentBasicInfoSchema.shape,
  ...incidentSystemTechnologiesSchema.shape,
  ...incidentTimelineSchema.shape,
  ...incidentRootCauseArchitectureSchema.shape,
  ...incidentPreventionSchema.shape,
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;
