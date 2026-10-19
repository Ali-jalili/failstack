"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
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
        aria-label={isOpen ? "Close account menu" : "Open account menu"}
        aria-expanded={isOpen}
        aria-controls="account-menu-panel"
        onClick={() => setIsOpen((open) => !open)}
        title="Account menu"
        className={`flex h-10 w-10 items-center justify-center rounded-sm text-slate-400 transition-colors duration-150 hover:bg-white/[0.04] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d12] motion-reduce:transition-none ${isOpen ? "bg-white/[0.04] text-slate-100" : ""}`}
      >
        <UserRound aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
      </button>

      {isOpen && (
        <section
          id="account-menu-panel"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2.5 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-slate-800 bg-[#0c1118] p-4 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.9)]"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-slate-500">
            Signed in as
          </p>
          <p className="mt-1.5 break-all text-[13px] text-slate-200">
            {email ?? "Signed in"}
          </p>
          {isReviewer && (
            <p className="mt-3 inline-flex items-center gap-2 rounded border border-amber-300/20 bg-amber-300/[0.07] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-amber-100">
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
