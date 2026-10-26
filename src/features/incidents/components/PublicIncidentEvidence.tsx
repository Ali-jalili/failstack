/** @format */

"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, GitCommit, Link2 } from "lucide-react";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import type { TimelineEvent } from "@/types/incident";
import {
  hasConfigDiff,
  label,
  offsetClockLabel,
  stageColors,
} from "./public-incident-formatters";
import {
  Code2Icon,
  GitCommitIcon,
  ScrollTextIcon,
} from "./public-incident-icons";
import type { EvidenceTab } from "./public-incident-types";

export function PublicIncidentEvidence({
  incident,
  events,
  activeTab,
  onTabChange,
}: {
  incident: PublishedIncident;
  events: TimelineEvent[];
  activeTab: EvidenceTab;
  onTabChange: (tab: EvidenceTab) => void;
}) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const cliEvidence = useMemo(
    () =>
      events
        .filter((event) => (event.cliCommands?.length ?? 0) > 0)
        .map((event) => ({ event, commands: event.cliCommands ?? [] })),
    [events],
  );
  const hasConfigEvidence = hasConfigDiff(incident.architecture_diff);
  const hasExternalEvidence = Boolean(incident.official_post_mortem_url);
  const tabs: { id: EvidenceTab; name: string; has: boolean }[] = [
    { id: "config", name: "Configuration", has: hasConfigEvidence },
    { id: "cli", name: "CLI Commands", has: cliEvidence.length > 0 },
    { id: "external", name: "External post-mortem", has: hasExternalEvidence },
  ];
  const effectiveTab: EvidenceTab = tabs.find((tab) => tab.id === activeTab)
    ?.has
    ? activeTab
    : (tabs.find((tab) => tab.has)?.id ?? "config");

  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  }

  return (
    <div className="pid-evidence-col">
      <div
        className="public-evidence-tabs"
        role="tablist"
        aria-label="Evidence categories"
      >
        {tabs.map((tab) => {
          const Icon =
            tab.id === "config"
              ? GitCommitIcon
              : tab.id === "cli"
                ? Code2Icon
                : ScrollTextIcon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={effectiveTab === tab.id}
              disabled={!tab.has}
              className={
                "public-evidence-tab" +
                (effectiveTab === tab.id ? " is-active" : "")
              }
              style={!tab.has ? { opacity: 0.4 } : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon color={effectiveTab === tab.id ? "#7dd3fc" : "#64748b"} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="public-evidence-panel">
        {effectiveTab === "config" &&
          (hasConfigEvidence ? (
            <div className="public-diff">
              <div className="public-diff-head">
                <span className="public-diff-head-cell is-before">Before</span>
                <span className="public-diff-head-cell is-after">After</span>
              </div>
              <div className="public-diff-body">
                <div className="public-diff-col is-before">
                  <DiffLines
                    text={incident.architecture_diff.beforeFix ?? ""}
                  />
                </div>
                <div className="public-diff-col is-after">
                  <DiffLines text={incident.architecture_diff.afterFix ?? ""} />
                </div>
              </div>
              <div className="public-diff-foot">
                {incident.architecture_diff.notes && (
                  <p className="public-diff-note">
                    {incident.architecture_diff.notes}
                  </p>
                )}
                <span
                  className={
                    "public-diff-verified " +
                    (incident.architecture_diff.isFact
                      ? "is-fact"
                      : "is-inferred")
                  }
                >
                  <GitCommit aria-hidden className="h-3 w-3" />
                  {incident.architecture_diff.isFact
                    ? "Recorded as fact"
                    : "Author interpretation"}
                </span>
              </div>
            </div>
          ) : (
            <div className="public-evidence-empty">
              No configuration or change record was included in this report.
            </div>
          ))}

        {effectiveTab === "cli" &&
          (cliEvidence.length ? (
            <div className="public-cli-list">
              {cliEvidence.map(({ event, commands }) => (
                <div key={event.id} className="public-cli-item">
                  <div className="public-cli-item-head">
                    <span
                      className="public-cli-item-offset"
                      style={{ color: stageColors[event.stage] ?? "#94a3b8" }}
                    >
                      {offsetClockLabel(
                        incident.occurred_at,
                        event.timestampOffsetMinutes,
                      )}{" "}
                      · {label(event.stage)}
                    </span>
                    <span className="public-cli-item-event">{event.title}</span>
                  </div>
                  <div className="public-cli-item-body">
                    {commands.map((command, index) => (
                      <div key={index} className="public-cli-cmd">
                        <pre>{command}</pre>
                        <button
                          type="button"
                          className={
                            "public-cli-copy" +
                            (copiedCommand === command ? " is-copied" : "")
                          }
                          onClick={() => void copyCommand(command)}
                        >
                          {copiedCommand === command ? (
                            <>
                              <Check aria-hidden className="h-3 w-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy aria-hidden className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="public-evidence-empty">
              No CLI commands were recorded for this incident.
            </div>
          ))}

        {effectiveTab === "external" &&
          (incident.official_post_mortem_url ? (
            <div
              className="public-evidence-empty"
              style={{ borderStyle: "solid" }}
            >
              <p
                style={{
                  marginBottom: "0.5rem",
                  color: "#cbd5e1",
                  fontWeight: 500,
                }}
              >
                Official post-mortem
              </p>
              <p>
                The report author linked the organization&rsquo;s public
                post-mortem:
              </p>
              <a
                className="public-postmortem-link"
                href={incident.official_post_mortem_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 aria-hidden className="h-3.5 w-3.5" />
                {incident.official_post_mortem_url}
                <ArrowUpRight aria-hidden className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="public-evidence-empty">
              No external post-mortem link was provided.
            </div>
          ))}

        {copiedCommand && (
          <p role="status" className="sr-only">
            Command copied.
          </p>
        )}
      </div>
    </div>
  );
}

function DiffLines({ text }: { text: string }) {
  return (
    <div className="pid-diff-lines">
      {text.split("\n").map((line, index) => (
        <div key={index} className="pid-diff-line">
          <span aria-hidden>{index + 1}</span>
          <code>{line || " "}</code>
        </div>
      ))}
    </div>
  );
}
