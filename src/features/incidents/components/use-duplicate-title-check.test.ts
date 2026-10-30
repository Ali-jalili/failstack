/** @format */

/**
 * @vitest-environment jsdom
 *
 * QA-015 regression tests for the duplicate-title warning hook.
 *
 * Covers the expected-behavior contract:
 *  1. Duplicate title produces a warning.
 *  2. A non-duplicate title does not produce a warning.
 *  3. The warning does not block submission (covered by IncidentForm tests).
 *  4. A failed title-check request is swallowed (submission never blocked).
 *  5. The warning clears when the title changes to a non-duplicate.
 * Plus guard-rail behavior: empty/unchanged titles issue no requests, and
 * concurrent runs are collapsed into one.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useDuplicateTitleCheck } from "./use-duplicate-title-check";

// The hook value-imports `checkDuplicateTitle` from the server-action module
// (whose module graph pulls in the Next-only `server-only` guard, unresolvable
// under Vitest's jsdom transform). Every test below injects its own `check`
// double, so the server module only needs to load — mock it.
vi.mock("@/features/incidents/server/title-duplicates", () => ({
  checkDuplicateTitle: vi.fn(),
}));

type CheckDuplicateTitleResult =
  | { checked: false }
  | { checked: true; duplicate: boolean };

type CheckFn = (input: {
  title: string;
  incidentId?: string;
}) => Promise<CheckDuplicateTitleResult>;

/**
 * A check double whose next results are driven per-assertion via `queue`.
 * Records every call so guard-rail tests can assert on request volume.
 */
function createCheckDouble() {
  const queued: CheckDuplicateTitleResult[] = [];
  const calls: Array<{ title: string; incidentId?: string }> = [];

  const impl: CheckFn = vi.fn(async (input) => {
    calls.push({ title: input.title, incidentId: input.incidentId });
    return queued.shift() ?? { checked: true, duplicate: false };
  });

  return {
    impl,
    calls,
    queue: (...results: CheckDuplicateTitleResult[]) => {
      queued.push(...results);
    },
  };
}

function optionsFor(
  currentTitle: string,
  check: CheckFn,
  overrides: {
    mode?: "create" | "edit";
    incidentId?: string;
  } = {},
) {
  return {
    mode: overrides.mode ?? ("create" as const),
    incidentId: overrides.incidentId,
    getCurrentTitle: () => currentTitle,
    check,
  };
}

describe("useDuplicateTitleCheck — QA-015 warning behavior", () => {
  afterEach(() => {
    cleanup();
  });

  it("produces a warning when the title duplicates an existing incident", async () => {
    const check = createCheckDouble();
    check.queue({ checked: true, duplicate: true });

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(optionsFor("Database outage", check.impl)),
    );

    await act(async () => {
      await result.current.runCheck("Database outage");
    });

    expect(result.current.warning).not.toBeNull();
    expect(result.current.warning).toMatch(/already uses this title/);
  });

  it("does not produce a warning for a non-duplicate title", async () => {
    const check = createCheckDouble();
    check.queue({ checked: true, duplicate: false });

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(
        optionsFor("Disk failure in storage cluster", check.impl),
      ),
    );

    await act(async () => {
      await result.current.runCheck("Disk failure in storage cluster");
    });

    expect(result.current.warning).toBeNull();
  });

  it("clears a previous warning when the title changes to a non-duplicate", async () => {
    const check = createCheckDouble();
    check.queue(
      { checked: true, duplicate: true },
      { checked: true, duplicate: false },
    );

    // The getter must read the *current* title dynamically (like the real
    // form does via getValues) so the hook's stale-result guard compares
    // against the live value, not a captured mount-time snapshot.
    const state = { currentTitle: "Database outage" };
    const { result } = renderHook(() =>
      useDuplicateTitleCheck({
        mode: "create",
        getCurrentTitle: () => state.currentTitle,
        check: check.impl,
      }),
    );

    await act(async () => {
      await result.current.runCheck("Database outage");
    });
    expect(result.current.warning).not.toBeNull();

    state.currentTitle = "Database outage in the backup region";
    await act(async () => {
      await result.current.runCheck(state.currentTitle);
    });
    expect(result.current.warning).toBeNull();
  });

  it("issues no request for empty or unchanged titles", async () => {
    const check = createCheckDouble();
    check.queue(
      { checked: true, duplicate: true },
      { checked: true, duplicate: true },
    );

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(optionsFor("Database outage", check.impl)),
    );

    await act(async () => {
      // Whitespace-only title: skipped without a request.
      await result.current.runCheck("   ");
      // Not yet answered for this title: one request is made.
      await result.current.runCheck("Database outage");
      // Same title again: guarded, no second request.
      await result.current.runCheck("Database outage");
    });

    expect(check.calls).toHaveLength(1);
    expect(result.current.warning).not.toBeNull();
  });

  it("collapses concurrent runs into a single request", async () => {
    let release: (() => void) | undefined;

    const slowImpl: CheckFn = vi.fn(
      () =>
        new Promise<CheckDuplicateTitleResult>((resolve) => {
          release = () => resolve({ checked: true, duplicate: true });
        }),
    );

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(optionsFor("Database outage", slowImpl)),
    );

    let first: Promise<void>;
    await act(async () => {
      first = result.current.runCheck("Database outage");
    });

    // A concurrent run for the same title must not spawn a second request.
    await act(async () => {
      await result.current.runCheck("Database outage");
    });

    await act(async () => {
      release?.();
      await first;
    });

    expect(slowImpl).toHaveBeenCalledTimes(1);
    expect(result.current.warning).not.toBeNull();
  });

  it("passes the incident id through in edit mode so it is excluded", async () => {
    const check = createCheckDouble();

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(
        optionsFor("Database outage", check.impl, {
          mode: "edit",
          incidentId: "incident-42",
        }),
      ),
    );

    await act(async () => {
      await result.current.runCheck("Database outage");
    });

    expect(check.calls).toHaveLength(1);
    expect(check.calls[0]).toEqual({
      title: "Database outage",
      incidentId: "incident-42",
    });
  });

  it("swallows a failed check so submission is never blocked", async () => {
    const failingCheck = vi.fn(async () => {
      throw new Error("network down");
    });

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(optionsFor("Database outage", failingCheck)),
    );

    let error: unknown;
    await act(async () => {
      try {
        await result.current.runCheck("Database outage");
      } catch (err) {
        error = err;
      }
    });

    expect(error).toBeUndefined();
    expect(failingCheck).toHaveBeenCalledTimes(1);
    expect(result.current.warning).toBeNull();
  });

  it("leaves the warning untouched when the check did not run (checked: false)", async () => {
    const check = createCheckDouble();
    check.queue({ checked: false });

    const { result } = renderHook(() =>
      useDuplicateTitleCheck(optionsFor("Database outage", check.impl)),
    );

    await act(async () => {
      await result.current.runCheck("Database outage");
    });

    expect(result.current.warning).toBeNull();
    // A not-checked result must not poison the guard: re-checking the same
    // title issues a fresh request.
    check.queue({ checked: true, duplicate: true });
    await act(async () => {
      await result.current.runCheck("Database outage");
    });
    expect(check.calls).toHaveLength(2);
    expect(result.current.warning).not.toBeNull();
  });
});
