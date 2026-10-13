"use client";

import { useState, useTransition } from "react";
import { handleLogout } from "@/features/auth/server/actions";

export default function LogoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function logout() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await handleLogout();
        if (result.error) setError("Unable to sign out. Please try again.");
      } catch {
        setError("Unable to sign out. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-48 text-right text-[10px] text-rose-300">
          {error}
        </span>
      )}
    </div>
  );
}
