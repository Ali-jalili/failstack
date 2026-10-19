"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { handleLogout } from "@/features/auth/server/actions";

/**
 * Next.js throws a NEXT_REDIRECT error when a server action calls
 * redirect(). We detect it by checking the `digest` property that Next
 * attaches to the thrown error object.
 */
function isNextRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest!.startsWith("NEXT_REDIRECT")
  );
}

export default function LogoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function logout() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await handleLogout();
        if (result.error) setError("Unable to sign out. Please try again.");
      } catch (caught) {
        // The redirect() call in handleLogout throws a NEXT_REDIRECT error
        // that Next.js intercepts to trigger client-side navigation.
        // Only surface real sign-out failures — not the navigation itself.
        if (!isNextRedirectError(caught)) {
          setError("Unable to sign out. Please try again.");
        }
      }
    });
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        className="flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-medium text-slate-300 transition-colors duration-150 hover:bg-white/[0.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1118] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      >
        <LogOut aria-hidden="true" className="h-4 w-4 text-slate-500" strokeWidth={1.7} />
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-48 text-[10px] text-rose-300">
          {error}
        </span>
      )}
    </div>
  );
}
