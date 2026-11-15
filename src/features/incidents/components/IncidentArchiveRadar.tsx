import type { RefObject } from "react";
import type { PublishedIncidentSummary } from "@/features/incidents/server/queries";
import { severityClass } from "./IncidentArchiveRow";
const RADAR_SWEEP_SECONDS = 5;

const radarBlips = [
  { angle: 18, radius: 0.78 },
  { angle: 47, radius: 0.62 },
  { angle: 76, radius: 0.86 },
  { angle: 112, radius: 0.7 },
  { angle: 139, radius: 0.92 },
  { angle: 167, radius: 0.58 },
  { angle: 202, radius: 0.82 },
  { angle: 229, radius: 0.67 },
  { angle: 258, radius: 0.9 },
  { angle: 291, radius: 0.73 },
  { angle: 323, radius: 0.88 },
  { angle: 345, radius: 0.6 },
];

export default function IncidentArchiveRadar({
  radarSize,
  radarRef,
  visibleIncidents,
  filteredCount,
  activeId,
}: {
  radarSize: { width: number; height: number };
  radarRef: RefObject<SVGSVGElement | null>;
  visibleIncidents: PublishedIncidentSummary[];
  filteredCount: number;
  activeId: string | null;
}) {
  const centerX = radarSize.width * 0.205;
  const centerY = radarSize.height / 2;
  const radius = Math.min(radarSize.width * 0.205, radarSize.height * 0.465);
  const radarPath = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX} ${centerY + radius}`;

  return (<svg
                  className="archive-radar-svg"
                  ref={radarRef}
                  viewBox={`0 0 ${radarSize.width} ${radarSize.height}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <clipPath id="archive-radar-viewport">
                      <rect
                        x="0"
                        y="0"
                        width={radarSize.width}
                        height={radarSize.height}
                      />
                    </clipPath>
                    <linearGradient id="archive-radar-sweep" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c6e47c" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#c6e47c" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <g
                    className="archive-radar-instrument"
                    clipPath="url(#archive-radar-viewport)"
                  >
                    {[0.32, 0.54, 0.76, 1].map((scale) => (
                      <circle
                        key={scale}
                        className="archive-radar-ring"
                        cx={centerX}
                        cy={centerY}
                        r={radius * scale}
                      />
                    ))}
                    <path
                      className="archive-radar-crosshair"
                      d={`M ${centerX - radius} ${centerY} H ${centerX + radius} M ${centerX} ${centerY - radius} V ${centerY + radius}`}
                    />
                    <path className="archive-radar-orbit" d={radarPath} />
                    {radarBlips.map((blip) => {
                      const radians = (blip.angle * Math.PI) / 180;
                      const x = Number(
                        (centerX + Math.sin(radians) * radius * blip.radius).toFixed(2),
                      );
                      const y = Number(
                        (centerY - Math.cos(radians) * radius * blip.radius).toFixed(2),
                      );
                      return (
                        <circle
                          key={blip.angle}
                          className="archive-radar-blip"
                          cx={x}
                          cy={y}
                          r="2"
                          style={{
                            animationDelay: `${-(blip.angle / 360) * RADAR_SWEEP_SECONDS}s`,
                          }}
                        />
                      );
                    })}
                    <g
                      className="archive-radar-sweep"
                      style={{
                        transformBox: "view-box",
                        transformOrigin: `${centerX}px ${centerY}px`,
                      }}
                    >
                      <path
                        d={`M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} Z`}
                        fill="url(#archive-radar-sweep)"
                      />
                    </g>
                    {visibleIncidents.map((incident, index) => (
                      <g
                        key={incident.id}
                        className={`archive-orbit-point ${severityClass[incident.severity]}${activeId === incident.id ? " is-active" : ""}`}
                        data-point-id={incident.id}
                        transform={`translate(${centerX} ${centerY})`}
                        opacity="0"
                      >
                        <circle
                          className="archive-orbit-echo"
                          r="8"
                          style={{ animationDelay: `${index * 0.18}s` }}
                        />
                        <circle r={activeId === incident.id ? 6 : 4} />
                      </g>
                    ))}
                    {visibleIncidents.map((incident) => (
                      <path
                        key={`link-${incident.id}`}
                        className={`archive-radar-connection ${severityClass[incident.severity]}${activeId === incident.id ? " is-active" : ""}`}
                        data-link-id={incident.id}
                        d=""
                      />
                    ))}
                    <circle
                      className="archive-radar-core"
                      cx={centerX}
                      cy={centerY}
                      r={radius * 0.32}
                    />
                    <text
                      className="archive-radar-title"
                      x={centerX}
                      y={centerY - 5}
                    >
                      Incident
                    </text>
                    <text
                      className="archive-radar-title"
                      x={centerX}
                      y={centerY + 17}
                    >
                      Explorer
                    </text>
                    <text
                      className="archive-radar-count"
                      x={centerX}
                      y={centerY + 40}
                    >
                      {filteredCount} CASES
                    </text>
                  </g>
                </svg>
  );
}
