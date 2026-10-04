/** @format */

import { z } from "zod";

import { incidentPatternSchema, incidentSeveritySchema } from "./incident";

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

export type IncidentBasicInfoValues = z.infer<typeof incidentBasicInfoSchema>;
