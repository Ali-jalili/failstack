/** @format */

import "server-only";

export function logServerError(
  context: string,
  error: unknown,
  userMessage: string,
): string {
  console.error(`[${context}]`, error);
  return userMessage;
}

/**
 * Formats the issues of a failed Zod parse into a single human-readable
 * string ("path: message; path: message") for surfacing to the user.
 * Pass a failed `safeParse` result's `.error` to this.
 */
export function formatZodError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
    .join("; ");
}
