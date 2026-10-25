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
} from "@/app/review/incidents/components/visualization-shared";

export { SectionHeading } from "@/app/review/incidents/components/section-heading";

export { IncidentTimeline } from "@/app/review/incidents/components/incident-timeline";

export { RootCauseDiagram } from "@/app/review/incidents/components/root-cause-diagram";

export { ArchitectureDiffDiagram } from "@/app/review/incidents/components/architecture-diff-diagram";

export { PreventionList } from "@/app/review/incidents/components/prevention-list";

export { ProgressRing } from "@/app/review/incidents/components/progress-ring";

export { IncidentFactsBar } from "@/app/review/incidents/components/incident-facts-bar";
