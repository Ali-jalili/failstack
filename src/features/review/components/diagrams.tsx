/** @format */

/*
 * Compatibility barrel for the review visualization modules.
 * All implementations now live in their own files; this barrel
 * re-exports the public symbols so existing imports keep working.
 */

export {
  severityMeta,
  formatDate,
  formatLabel,
  patternLabel,
} from "@/features/review/components/visualization-shared";

export { SectionHeading } from "@/features/review/components/section-heading";

export { IncidentTimeline } from "@/features/review/components/incident-timeline";

export { RootCauseDiagram } from "@/features/review/components/root-cause-diagram";

export { ArchitectureDiffDiagram } from "@/features/review/components/architecture-diff-diagram";

export { PreventionList } from "@/features/review/components/prevention-list";

export { ProgressRing } from "@/features/review/components/progress-ring";

export { IncidentFactsBar } from "@/features/review/components/incident-facts-bar";
