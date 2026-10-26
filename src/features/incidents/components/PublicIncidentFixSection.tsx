import { AlertTriangle, ArrowUpRight, Check, GitBranch, Zap } from "lucide-react";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import type { TimelineEvent } from "@/types/incident";
import { offsetClockLabel, short, wrapSvgLabel } from "./public-incident-formatters";

export function PublicIncidentFixSection({
  incident,
  components,
  failedComponents,
  mitigationEvents,
}: {
  incident: PublishedIncident;
  components: string[];
  failedComponents: Set<string>;
  mitigationEvents: TimelineEvent[];
}) {
  return (
    <section id="section-fix" className="public-section pid-section">
      <div className="pid-split pid-split-fix">
        <div className="public-section-header">
          <p className="public-section-eyebrow" style={{ color: "#38bdf8" }}>
            <span className="public-section-number">05</span>The fix &amp; lessons
          </p>
          <h2 className="public-section-title">How it was resolved?</h2>
          <p className="public-section-description">
            What changed, and what we learned to prevent this from happening again.
          </p>
        </div>

        <div className="pid-fix-col">
          <div className="pid-compare">
            <div className="pid-compare-col is-bad">
              <p className="pid-compare-state is-bad">
                <AlertTriangle aria-hidden className="h-3 w-3" /> Before
                (problematic)
              </p>
              <div className="pid-mini-topology">
                <MiniTopology
                  system={incident.system}
                  components={components}
                  failedComponents={failedComponents}
                  variant="before"
                />
              </div>
              <pre className="pid-compare-text">
                {architectureStateText(
                  incident.architecture_diff.beforeFix,
                  "No before-fix state was recorded.",
                )}
              </pre>
            </div>
            <span className="pid-compare-arrow" aria-hidden>
              <ArrowUpRight
                className="h-5 w-5"
                style={{ transform: "rotate(45deg)" }}
              />
            </span>
            <div className="pid-compare-col is-good">
              <p className="pid-compare-state is-good">
                <Check aria-hidden className="h-3 w-3" /> After (fixed)
              </p>
              <div className="pid-mini-topology">
                <MiniTopology
                  system={incident.system}
                  components={components}
                  failedComponents={new Set()}
                  variant="after"
                />
              </div>
              <pre className="pid-compare-text">
                {architectureStateText(
                  incident.architecture_diff.afterFix,
                  "No after-fix state was recorded.",
                )}
              </pre>
            </div>
          </div>

          <p className="public-fix-flow-title pid-fix-subtitle">
            <GitBranch
              aria-hidden
              className="h-3.5 w-3.5"
              style={{ color: "#d5eca0" }}
            />
            Recorded response
          </p>
          {mitigationEvents.length ? (
            <ol className="pid-response">
              {mitigationEvents.map((event) => (
                <li key={event.id}>
                  <span className="pid-response-time">
                    <Zap aria-hidden className="h-3 w-3" />{" "}
                    {offsetClockLabel(
                      incident.occurred_at,
                      event.timestampOffsetMinutes,
                    )}
                  </span>
                  <span>{event.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="public-fix-note">No mitigation events recorded.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function architectureStateText(
  value: string | undefined | null,
  emptyLabel: string,
) {
  return value && value.trim().length > 0 ? value : emptyLabel;
}

function hexPoints(cx: number, cy: number, radius: number) {
  const points: string[] = [];
  for (let index = 0; index < 6; index++) {
    const angle = (Math.PI / 180) * (60 * index - 90);
    points.push(
      (cx + radius * Math.cos(angle)).toFixed(1) +
        "," +
        (cy + radius * Math.sin(angle)).toFixed(1),
    );
  }
  return points.join(" ");
}

function MiniTopology({
  system,
  components,
  failedComponents,
  variant,
}: {
  system: string;
  components: string[];
  failedComponents: Set<string>;
  variant: "before" | "after";
}) {
  const height = 180;
  const centerX = 82;
  const centerY = height / 2;
  const radius = 42;
  const others = components.filter((component) => component !== system).slice(0, 2);
  const slots = [{ x: 286, y: 45 }, { x: 286, y: 135 }];
  const accent = variant === "before" ? "#fb7185" : "#34d399";
  const systemState = variant === "before" ? "Affected" : "Post-fix";

  return (
    <svg
      viewBox="0 0 360 180"
      role="img"
      aria-label={`Before/after mini topology: ${variant}`}
      className="pid-mini-topology-svg"
    >
      {others.map((name, index) => {
        const node = slots[index];
        const failed = variant === "before" && failedComponents.has(name);
        return (
          <g key={name}>
            <line
              x1={centerX + radius}
              y1={centerY}
              x2={node.x - radius}
              y2={node.y}
              stroke={failed ? "#fb7185" : variant === "after" ? "#34d399" : "#475569"}
              strokeOpacity=".8"
              strokeWidth="1.1"
              strokeDasharray={variant === "before" && !failed ? "3 3" : undefined}
            />
            {failed && (
              <circle
                cx={(centerX + radius + node.x - radius) / 2}
                cy={(centerY + node.y) / 2}
                r="2.5"
                fill="#fb7185"
              />
            )}
          </g>
        );
      })}

      <polygon
        points={hexPoints(centerX, centerY, radius)}
        fill={variant === "before" ? "rgba(251,113,133,.14)" : "rgba(52,211,153,.1)"}
        stroke={accent}
        strokeWidth="1.4"
      />
      <text x={centerX} y={centerY - 2} textAnchor="middle" fill="#eef2f7" fontSize="9.5" fontWeight="600">
        {short(system, 14)}
      </text>
      <text x={centerX} y={centerY + 12} textAnchor="middle" fill={accent} fontSize="8.5">
        {systemState}
      </text>

      {others.map((name, index) => {
        const node = slots[index];
        const failed = variant === "before" && failedComponents.has(name);
        const color = failed ? "#fb7185" : "#34d399";
        const nameLines = wrapSvgLabel(name, 16);
        return (
          <g key={name}>
            <polygon
              points={hexPoints(node.x, node.y, radius)}
              fill={failed ? "rgba(251,191,36,.12)" : "rgba(52,211,153,.07)"}
              stroke={color}
              strokeWidth="1.1"
            />
            <text
              x={node.x}
              y={node.y - (nameLines.length - 1) * 4 + 3}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="8.2"
              fontWeight="600"
              aria-label={name}
            >
              {nameLines.map((line, lineIndex) => (
                <tspan key={`${line}-${lineIndex}`} x={node.x} dy={lineIndex === 0 ? 0 : 8}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
