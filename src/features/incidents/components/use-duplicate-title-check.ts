/** @format */

"use client";

import { useCallback, useRef, useState } from "react";
import {
  checkDuplicateTitle,
  type CheckDuplicateTitleResult,
} from "@/features/incidents/server/title-duplicates";

const DUPLICATE_MESSAGE =
  "Another published incident already uses this title. You can still submit this report as-is.";

export interface DuplicateTitleCheck {
  /**
   * The advisory warning text, or null. Never reflects an error state: a failed
   * title check is swallowed so it can never block submission.
   */
  warning: string | null;
  /**
   * Run the duplicate-title check for `title`. Guarded against concurrent runs
   * and re-checking a title that was already answered, so repeated back/forward
   * navigation does not hammer the database.
   */
  runCheck: (title: string) => Promise<void>;
}

/**
 * QA-015 — non-blocking duplicate-title warning.
 *
 * Owns the advisory state and the guard rails (debounce-by-title, in-flight
 * lock, stale-result protection) so the incident form can trigger a check at
 * a decision point (leaving the title step) without per-keystroke requests.
 */
export function useDuplicateTitleCheck(options: {
  mode: "create" | "edit";
  incidentId?: string;
  /**
   * Returns the title currently in the form. Used to discard results that
   * arrive after the user has already typed a different title, so a stale
   * "duplicate" answer never surfaces against a corrected title.
   */
  getCurrentTitle: () => string;
  /**
   * Injectable for tests; defaults to the real server action.
   */
  check?: (input: {
    title: string;
    incidentId?: string;
  }) => Promise<CheckDuplicateTitleResult>;
}): DuplicateTitleCheck {
  const { mode, incidentId, getCurrentTitle } = options;
  const check = options.check ?? checkDuplicateTitle;

  const [warning, setWarning] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const lastCheckedTitleRef = useRef<string | null>(null);

  const runCheck = useCallback(
    async (title: string) => {
      if (
        title.trim().length === 0 ||
        title === lastCheckedTitleRef.current ||
        inFlightRef.current
      ) {
        return;
      }

      inFlightRef.current = true;
      try {
        const result = await check({
          title,
          incidentId: mode === "edit" ? incidentId : undefined,
        });

        // The title may have changed while the request was in flight; apply
        // only the result for the current value.
        if (title !== getCurrentTitle()) return;

        if (result.checked) {
          lastCheckedTitleRef.current = title;
          setWarning(result.duplicate ? DUPLICATE_MESSAGE : null);
        }
      } catch {
        // A failed title check must never block incident submission.
      } finally {
        inFlightRef.current = false;
      }
    },
    [check, mode, incidentId, getCurrentTitle],
  );

  return { warning, runCheck };
}
