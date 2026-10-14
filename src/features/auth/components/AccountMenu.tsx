"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
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
        aria-label="Open account menu"
        aria-expanded={isOpen}
        aria-controls="account-menu-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 items-center gap-2 border border-slate-800 px-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] sm:px-3"
      >
        <UserRound aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
        <span className="hidden sm:inline">Account</span>
        <ChevronDown
          aria-hidden="true"
          className={`hidden h-3 w-3 text-slate-500 transition-transform sm:block ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <section
          id="account-menu-panel"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] border border-slate-800 bg-[#0c131d] p-4 shadow-[0_20px_55px_-24px_rgba(0,0,0,0.95)]"
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">
            Signed in as
          </p>
          <p className="mt-2 break-all text-sm text-slate-200">
            {email ?? "Signed in"}
          </p>
          {isReviewer && (
            <p className="mt-3 inline-flex items-center gap-2 border border-amber-300/20 bg-amber-300/[0.07] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-100">
              <span className="h-1.5 w-1.5 bg-amber-300" />
              Reviewer access
            </p>
          )}
          <div className="mt-4 border-t border-slate-800 pt-3">
            <LogoutButton />
          </div>
        </section>
      )}
    </div>
  );
}
