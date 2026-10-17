/** @format */

export function getSafeRedirectPath(
  destination: unknown,
  fallback = "/",
): string {
  if (
    typeof destination !== "string" ||
    !destination.startsWith("/") ||
    destination.startsWith("//") ||
    destination.includes("\\")
  ) {
    return fallback;
  }

  try {
    const url = new URL(destination, "https://failstack.invalid");
    if (url.origin !== "https://failstack.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
