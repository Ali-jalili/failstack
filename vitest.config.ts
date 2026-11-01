/** @format */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors the `@/*` path alias from tsconfig.json so that server modules
// (which import each other via `@/...`) resolve under Vitest.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // `.build-validation/` is an untracked project mirror created by a
    // build-validation workflow; its stale copies of source files must not
    // be picked up as test files.
    exclude: ["**/node_modules/**", "**/dist/**", ".build-validation/**"],
  },
});
