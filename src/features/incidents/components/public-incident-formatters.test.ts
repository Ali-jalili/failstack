/** @format */

import { describe, expect, it } from "vitest";
import type { ArchitectureDiff } from "@/types/incident";
import {
  dateLabel,
  dateTimeLabel,
  durationLabel,
  hasConfigDiff,
  label,
  offsetClockLabel,
  patternLabel,
  short,
  stageColors,
  wrapSvgLabel,
} from "./public-incident-formatters";

describe("label", () => {
  it("replaces underscores with spaces and lowercases", () => {
    expect(label("MY_EVENT")).toBe("my event");
  });

  it("lowercases a plain string without underscores", () => {
    expect(label("FAILED")).toBe("failed");
  });

  it("returns an empty string for empty input", () => {
    expect(label("")).toBe("");
  });
});

describe("patternLabel", () => {
  it("title-cases each word of an underscored pattern", () => {
    expect(patternLabel("SINGLE_POINT_OF_FAILURE")).toBe(
      "Single Point Of Failure",
    );
  });

  it("handles two-word patterns", () => {
    expect(patternLabel("POISON_PILL")).toBe("Poison Pill");
  });
});

describe("dateLabel", () => {
  it("formats a UTC timestamp as a long English date", () => {
    expect(dateLabel("2026-01-01T00:00:00Z")).toBe("January 1, 2026");
  });

  it("formats non-UTC inputs in UTC terms", () => {
    // The time part of a later-day local time would shift; 23:30Z is still Jan 1
    expect(dateLabel("2026-01-01T23:30:00Z")).toBe("January 1, 2026");
  });
});

describe("dateTimeLabel", () => {
  it("formats a UTC timestamp as a short UTC date and time", () => {
    expect(dateTimeLabel("2026-01-01T10:05:00Z")).toBe("Jan 1, 2026, 10:05 AM");
  });

  it("pads minutes to two digits", () => {
    expect(dateTimeLabel("2026-01-01T09:03:00Z")).toBe("Jan 1, 2026, 9:03 AM");
  });
});

describe("durationLabel", () => {
  it("renders sub-hour durations in minutes", () => {
    expect(durationLabel(59)).toBe("59 min");
  });

  it("renders zero minutes as minutes, not hours", () => {
    expect(durationLabel(0)).toBe("0 min");
  });

  it("renders whole hours without a minutes part", () => {
    expect(durationLabel(60)).toBe("1h");
    expect(durationLabel(120)).toBe("2h");
  });

  it("renders mixed hours and minutes", () => {
    expect(durationLabel(90)).toBe("1h 30m");
  });
});

describe("offsetClockLabel", () => {
  it("returns the base time for a zero offset", () => {
    expect(offsetClockLabel("2026-01-01T10:00:00Z", 0)).toBe("10:00 AM");
  });

  it("adds the offset in minutes to the base time", () => {
    expect(offsetClockLabel("2026-01-01T10:00:00Z", 90)).toBe("11:30 AM");
  });

  it("supports negative offsets (events before the reference time)", () => {
    expect(offsetClockLabel("2026-01-01T10:00:00Z", -60)).toBe("09:00 AM");
  });

  it("rolls past midnight into the next day", () => {
    expect(offsetClockLabel("2026-01-01T23:00:00Z", 90)).toBe("12:30 AM");
  });
});

describe("short", () => {
  it("truncates values longer than max with an ellipsis", () => {
    expect(short("abcdef", 3)).toBe("abc…");
  });

  it("leaves values at or below max unchanged", () => {
    expect(short("abc", 3)).toBe("abc");
    expect(short("abcdef", 6)).toBe("abcdef");
  });

  it("returns only the ellipsis when max is zero", () => {
    expect(short("abc", 0)).toBe("…");
  });
});

describe("hasConfigDiff", () => {
  it("is true when beforeFix has content", () => {
    expect(hasConfigDiff({ beforeFix: "x", afterFix: "", isFact: true })).toBe(
      true,
    );
  });

  it("is true when only afterFix has content", () => {
    expect(hasConfigDiff({ beforeFix: "", afterFix: "y", isFact: true })).toBe(
      true,
    );
  });

  it("treats whitespace-only fields as empty", () => {
    expect(
      hasConfigDiff({ beforeFix: "  ", afterFix: "  ", isFact: true }),
    ).toBe(false);
  });

  it("is false when both fields are empty", () => {
    expect(hasConfigDiff({ beforeFix: "", afterFix: "", isFact: true })).toBe(
      false,
    );
  });

  // Incomplete-data case: DB rows are cast, not validated, so a diff object
  // may arrive with fields set to undefined. The formatter must stay null-safe.
  it("treats undefined fields as empty (null-safe on incomplete data)", () => {
    const diff = {
      beforeFix: undefined,
      afterFix: undefined,
      isFact: false,
    } as unknown as ArchitectureDiff;
    expect(hasConfigDiff(diff)).toBe(false);
  });
});

describe("wrapSvgLabel", () => {
  it("packs words into at most two lines within the width budget", () => {
    // "aa bb cc dd ee" at 5 chars: "aa bb" fits (5), "cc dd" does not (6),
    // so line 2 takes "cc d…" (short("cc dd…", 4)).
    expect(wrapSvgLabel("aa bb cc dd ee", 5)).toEqual(["aa bb", "cc d…"]);
  });

  it("returns a single line when one word fits", () => {
    expect(wrapSvgLabel("hi", 5)).toEqual(["hi"]);
  });

  it("truncates an over-long single word", () => {
    expect(wrapSvgLabel("abcdefghij", 5)).toEqual(["abcde…"]);
  });

  it("collapses internal whitespace and trims the ends", () => {
    expect(wrapSvgLabel("  hi   there ", 6)).toEqual(["hi", "there"]);
  });

  it("returns a single empty line for whitespace-only input", () => {
    expect(wrapSvgLabel("   ", 5)).toEqual([""]);
  });
});

describe("stageColors", () => {
  it("maps known stages to colors", () => {
    expect(stageColors["TRIGGER"]).toBe("#fb7185");
    expect(stageColors["MITIGATION"]).toBe("#a78bfa");
    expect(stageColors["PREVENTION"]).toBe("#34d399");
  });

  it("returns undefined for stages outside the map so callers can fall back", () => {
    expect(stageColors["UNKNOWN_STAGE"]).toBeUndefined();
  });
});
