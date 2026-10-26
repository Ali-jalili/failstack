import { useMemo } from "react";
import type { PublishedIncident } from "@/features/incidents/server/queries";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
} from "./public-incident-icons";
import { short, wrapSvgLabel } from "./public-incident-formatters";

export function PublicIncidentImpactMap({
  incident,
  components,
  failedComponents,
  causalComponentRoles,
}: {
  incident: PublishedIncident;
  components: string[];
  failedComponents: Set<string>;
  causalComponentRoles: Map<string, Set<string>>;
}) {
  const mapData = useMemo(() => {
    const W = 600;
    const H = 300;
    const nodeWidth = 150;
    const nodeHeight = 60;
    const system = { x: 16, y: H / 2 - 36, w: 150, h: 72 };
    const others = components.filter((component) => component !== incident.system).slice(0, 4);
    const slots = [
      { x: 226, y: 38 },
      { x: 226, y: 202 },
      { x: 430, y: 38 },
      { x: 430, y: 202 },
    ];
    const nodes = others.map((name, index) => ({
      name,
      x: slots[index].x,
      y: slots[index].y,
      w: nodeWidth,
      h: nodeHeight,
      failed: failedComponents.has(name),
      inCausalPath: causalComponentRoles.has(name),
      causalRoles: causalComponentRoles.get(name) ?? new Set<string>(),
    }));
    const edges = nodes.map((node, index) => {
      const fromNode = index < 2 ? null : nodes[index - 2];
      return {
        x1: fromNode ? fromNode.x + fromNode.w : system.x + system.w,
        y1: fromNode ? fromNode.y + fromNode.h / 2 : system.y + system.h / 2,
        x2: node.x - 4,
        y2: node.y + node.h / 2,
        failed: node.failed,
        inCausalPath: node.inCausalPath,
      };
    });
    return { W, H, system, nodes, edges };
  }, [components, causalComponentRoles, failedComponents, incident.system]);

  return (
    <div className="public-impact-map">
      <svg
        viewBox={`0 0 ${mapData.W} ${mapData.H}`}
        role="img"
        aria-label={`Impact map: ${incident.system} and the recorded components`}
      >
        <defs>
          <marker id="imp-arrow-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#fb7185" />
          </marker>
          <marker id="imp-arrow-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#34d399" />
          </marker>
          <marker id="imp-arrow-causal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#fbbf24" />
          </marker>
        </defs>

        {mapData.edges.map((edge, index) => (
          <line
            key={index}
            className="pid-impact-edge"
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.failed ? "#fb7185" : edge.inCausalPath ? "#fbbf24" : "#34d399"}
            strokeWidth="1.4"
            opacity=".85"
            markerEnd={`url(#imp-arrow-${edge.failed ? "bad" : edge.inCausalPath ? "causal" : "ok"})`}
          />
        ))}

        <rect
          className={`pid-impact-node-shape${failedComponents.has(incident.system) ? " is-failed" : causalComponentRoles.has(incident.system) ? " is-causal" : ""}`}
          x={mapData.system.x}
          y={mapData.system.y}
          width={mapData.system.w}
          height={mapData.system.h}
          rx="5"
          fill="rgba(251,113,133,.14)"
          stroke="#fb7185"
          strokeWidth="1.5"
        />
        <AlertTriangleIcon
          x={mapData.system.x + 14}
          y={mapData.system.y + mapData.system.h / 2 - 9}
          size={18}
          color="#fb7185"
        />
        <text x={mapData.system.x + 42} y={mapData.system.y + 32} fontSize="13" fontWeight="600" fill="#f2f5f0">
          {short(incident.system, 12)}
        </text>
        <text x={mapData.system.x + 42} y={mapData.system.y + 51} fontSize="11" fill="#fb7185">
          {incident.severity === "MINOR" ? "Impacted" : "Affected"}
        </text>

        {mapData.nodes.map((node) => {
          const color = node.failed ? "#fb7185" : node.inCausalPath ? "#fbbf24" : "#34d399";
          const roleLabel = node.failed
            ? node.causalRoles.has("DIRECT_FAILURE") ? "Direct failure" : "System impact"
            : node.causalRoles.has("ROOT_CAUSE") ? "Root cause"
              : node.causalRoles.has("CONTRIBUTING_FACTOR") ? "Contributing factor"
                : "Not in causal chain";
          const nameLines = wrapSvgLabel(node.name, 16);
          return (
            <g key={node.name}>
              <rect
                className={`pid-impact-node-shape${node.failed ? " is-failed" : node.inCausalPath ? " is-causal" : ""}`}
                x={node.x} y={node.y} width={node.w} height={node.h} rx="5"
                fill={node.failed ? "rgba(251,191,36,.1)" : "rgba(52,211,153,.07)"}
                stroke={color} strokeWidth="1.2"
              />
              {node.inCausalPath ? (
                <AlertTriangleIcon x={node.x + 12} y={node.y + node.h / 2 - 8} color={color} />
              ) : (
                <CheckCircleIcon x={node.x + 12} y={node.y + node.h / 2 - 8} color={color} />
              )}
              <text
                x={node.x + 38}
                y={node.y + (nameLines.length > 1 ? 21 : 31)}
                aria-label={node.name}
                fontSize="11.5"
                fontWeight="600"
                fill="#e2e8f0"
              >
                {nameLines.map((line, index) => (
                  <tspan key={`${line}-${index}`} x={node.x + 38} dy={index === 0 ? 0 : 14}>{line}</tspan>
                ))}
              </text>
              <text x={node.x + 38} y={node.y + 52} fontSize="9.5" fill={color}>{roleLabel}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
