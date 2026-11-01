import "server-only";

export function logServerError(
  context: string,
  error: unknown,
  userMessage: string,
): string {
  console.error(`[${context}]`, error);
  return userMessage;
}
