"use client";

import { useEffect, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";

export default function AccountMenu({
  email,
  isReviewer,
}: {
  email: string | null;
  isReviewer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="account-menu-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Account
      </button>

      {isOpen && (
        <section
          id="account-menu-panel"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl shadow-black/30"
        >
          <p className="break-all text-sm text-slate-200">
            {email ?? "Signed in"}
          </p>
          {isReviewer && (
            <p className="mt-1 text-xs text-slate-400">Reviewer</p>
          )}
          <div className="mt-4 border-t border-slate-800 pt-3">
            <LogoutButton />
          </div>
        </section>
      )}
    </div>
  );
}
