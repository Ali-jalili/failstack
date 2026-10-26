/** @format */

import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./redirect";

/**
 * Tests lock in the CURRENT behavior of getSafeRedirectPath:
 * - Layer 1 (string pre-checks): non-string input, not starting with "/",
 *   protocol-relative "//", and any backslash are rejected immediately.
 * - Layer 2 (URL parser): the destination is parsed against the virtual
 *   base "https://failstack.invalid"; anything whose parsed origin differs
 *   is rejected. On success the function returns the reconstructed
 *   `${pathname}${search}${hash}` — not the raw input.
 */
describe("getSafeRedirectPath", () => {
  describe("valid internal paths", () => {
    it("returns a plain internal path unchanged", () => {
      expect(getSafeRedirectPath("/my-incidents")).toBe("/my-incidents");
    });

    it("returns the root path", () => {
      expect(getSafeRedirectPath("/")).toBe("/");
    });

    it("preserves query and hash, normalized through the URL parser", () => {
      expect(getSafeRedirectPath("/my-incidents?tab=reports#3")).toBe(
        "/my-incidents?tab=reports#3",
      );
    });
  });

  describe("external or dangerous destinations", () => {
    it("rejects an absolute external URL", () => {
      expect(getSafeRedirectPath("https://evil.com/x")).toBe("/");
    });

    it("rejects a protocol-relative destination", () => {
      expect(getSafeRedirectPath("//evil.com/x")).toBe("/");
    });

    it("rejects a path containing a backslash", () => {
      expect(getSafeRedirectPath("/\\evil")).toBe("/");
    });

    it("rejects a script protocol that does not start with /", () => {
      expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/");
    });
  });

  describe("non-string input", () => {
    it("rejects null", () => {
      expect(getSafeRedirectPath(null)).toBe("/");
    });

    it("rejects undefined", () => {
      expect(getSafeRedirectPath(undefined)).toBe("/");
    });

    it("rejects a number", () => {
      expect(getSafeRedirectPath(123)).toBe("/");
    });

    it("rejects an object", () => {
      expect(getSafeRedirectPath({ href: "/x" })).toBe("/");
    });
  });

  describe("fallback behavior", () => {
    it("returns the default fallback (/) on rejection", () => {
      expect(getSafeRedirectPath("https://evil.com")).toBe("/");
    });

    it("uses a custom fallback on rejection", () => {
      expect(getSafeRedirectPath("//evil.com", "/incidents")).toBe(
        "/incidents",
      );
    });

    it("supports an empty-string fallback (login/signup pages)", () => {
      expect(getSafeRedirectPath(null, "")).toBe("");
    });

    it("ignores the fallback when the destination is valid", () => {
      expect(getSafeRedirectPath("/incidents", "")).toBe("/incidents");
    });
  });
});
