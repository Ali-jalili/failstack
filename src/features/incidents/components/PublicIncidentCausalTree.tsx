import type { RootCauseNode } from "@/types/incident";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowDownIcon,
  GitBranchIcon,
  ZapIcon,
} from "./public-incident-icons";
import { label } from "./public-incident-formatters";

const causeTypeColors: Record<string, { color: string; bg: string; border: string }> = {
  ROOT_CAUSE: {
    color: "#fb7185",
    bg: "rgba(251,113,133,.14)",
    border: "rgba(251,113,133,.6)",
  },
  CONTRIBUTING_FACTOR: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,.08)",
    border: "rgba(96,165,250,.5)",
  },
  DIRECT_FAILURE: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,.08)",
    border: "rgba(167,139,250,.5)",
  },
  SYSTEM_IMPACT: {
    color: "#38bdf8",
    bg: "rgba(56,189,248,.08)",
    border: "rgba(56,189,248,.5)",
  },
};

export function PublicIncidentCausalTree({
  causes,
  activeCauseId,
  onSelect,
}: {
  causes: RootCauseNode[];
  activeCauseId: string | null;
  onSelect: (id: string) => void;
}) {
  const order = ["ROOT_CAUSE", "CONTRIBUTING_FACTOR", "DIRECT_FAILURE", "SYSTEM_IMPACT"];
  const ordered = order.flatMap((type) => causes.filter((cause) => cause.type === type));
  const seen = new Set(ordered.map((cause) => cause.id));
  const list = [...ordered, ...causes.filter((cause) => !seen.has(cause.id))];

  return (
    <ol className="pid-chain" aria-label="Causal chain">
      {list.map((node, index) => {
        const meta = causeTypeColors[node.type] ?? causeTypeColors.SYSTEM_IMPACT;
        const isSelected = node.id === activeCauseId;
        const Icon =
          node.type === "ROOT_CAUSE"
            ? AlertTriangleIcon
            : node.type === "CONTRIBUTING_FACTOR"
              ? GitBranchIcon
              : node.type === "DIRECT_FAILURE"
                ? ZapIcon
                : ActivityIcon;
        return (
          <li key={node.id} className="pid-chain-item">
            {index > 0 && (
              <span className="pid-chain-arrow" aria-hidden>
                <ArrowDownIcon size={14} color="#60a5fa" />
              </span>
            )}
            <button
              type="button"
              id={"cause-" + node.id}
              className={"pid-chain-card" + (isSelected ? " is-active" : "")}
              style={{
                ["--cause-color" as string]: meta.color,
                ["--cause-bg" as string]: meta.bg,
                ["--cause-border" as string]: meta.border,
              }}
              aria-pressed={isSelected}
              onClick={() => onSelect(node.id)}
            >
              <span className="pid-chain-icon">
                <Icon color={meta.color} size={15} />
              </span>
              <span className="pid-chain-text">
                <span className="pid-chain-label">{label(node.type)}</span>
                <span className="pid-chain-title">{node.title}</span>
                {node.systemComponent && (
                  <span className="pid-chain-comp">{node.systemComponent}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
