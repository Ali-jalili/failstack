/** @format */

/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { RootCauseNode } from "@/types/incident";
import { RootCauseDiagram } from "./root-cause-diagram";

const nodes: RootCauseNode[] = [
  {
    id: "root",
    parentId: null,
    type: "ROOT_CAUSE",
    title: "Database unavailable",
    description: "Primary database became unreachable.",
    systemComponent: "Database",
  },
  {
    id: "factor",
    parentId: "root",
    type: "CONTRIBUTING_FACTOR",
    title: "Retries exhausted",
    description: "Requests exhausted their retry budget.",
    systemComponent: "API",
  },
];

afterEach(cleanup);

describe("RootCauseDiagram keyboard interaction", () => {
  it.each(["Enter", " "])("selects a node with %s", (key) => {
    render(<RootCauseDiagram nodes={nodes} />);

    const nodeButton = screen.getByRole("button", {
      name: "Contributing Factor: Retries exhausted",
    });
    expect(nodeButton.getAttribute("tabindex")).toBe("0");

    fireEvent.keyDown(nodeButton, { key });

    expect(
      screen.getByRole("heading", { name: "Retries exhausted" }),
    ).toBeTruthy();
  });
});
