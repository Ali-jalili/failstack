/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  FilePlus2,
  LogIn,
  Menu,
  UserRound,
  X,
} from "lucide-react";

interface NavbarLinkItem {
  label: string;
  href: string;
  primary?: boolean;
}

function NavigationItems({
  items,
  pathname,
  onNavigate,
  mobile = false,
  open = false,
}: {
  items: NavbarLinkItem[];
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
  open?: boolean;
}) {
  return (
    <>
      {items.map((item, index) => {
        const isActive = pathname === item.href;
        const Icon =
          item.href === "/incidents"
            ? BookOpen
            : item.href === "/incidents/new"
              ? FilePlus2
              : item.href === "/my-incidents"
                ? UserRound
                : item.href === "/review/incidents"
                  ? ClipboardCheck
                  : item.href === "/signup"
                    ? UserRound
                    : LogIn;

        const link = (
          <Link
            key={`${item.label}:${item.href}`}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={
              item.primary
                ? `group flex min-h-10 items-center justify-between gap-5 border px-3.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] ${
                    item.href === "/review/incidents"
                      ? "border-amber-300/35 bg-amber-300/[0.09] text-amber-100 hover:border-amber-200/65 hover:bg-amber-300/[0.14]"
                      : "border-[#c6e47c]/50 bg-[#c6e47c] text-[#11190a] hover:border-[#dcf7a0] hover:bg-[#dcf7a0]"
                  } ${mobile ? "w-full min-h-11" : ""}`
                : `group flex min-h-10 items-center gap-2.5 border px-3.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] ${
                    isActive
                      ? "border-slate-700/80 bg-slate-800/65 text-slate-100"
                      : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-100"
                  } ${mobile ? "w-full min-h-11 justify-between" : ""}`
            }
          >
            <span className="flex items-center gap-2.5">
              <Icon
                aria-hidden="true"
                className={`h-3.5 w-3.5 ${
                  item.primary && item.href === "/review/incidents"
                    ? "text-amber-200"
                    : item.primary
                      ? "text-[#243015]"
                      : "text-slate-500 transition-colors group-hover:text-[#c6e47c]"
                }`}
                strokeWidth={1.7}
              />
              {item.label}
            </span>
            {item.primary && (
              <ArrowUpRight
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                  item.href === "/review/incidents"
                    ? "text-amber-200"
                    : "text-[#243015]"
                }`}
                strokeWidth={1.8}
              />
            )}
          </Link>
        );

        if (!mobile) return link;

        // On mobile each item fades and slides in one after another.
        return (
          <div
            key={`${item.label}:${item.href}`}
            className={`transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${90 + index * 50}ms` : "0ms" }}
          >
            {link}
          </div>
        );
      })}
    </>
  );
}

export default function NavbarLinks({ items }: { items: NavbarLinkItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }

    // Keep the page from scrolling behind the open menu.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="relative flex shrink-0 items-center">
      <nav
        aria-label="Main navigation"
        className="hidden items-center gap-1 xl:flex"
      >
        <NavigationItems items={items} pathname={pathname} />
      </nav>

      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className={`relative flex h-10 w-10 items-center justify-center border text-slate-300 transition-colors duration-200 hover:border-slate-600 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16] xl:hidden ${
          isOpen ? "border-slate-600 bg-slate-900" : "border-slate-800"
        }`}
      >
        <span className="relative block h-4 w-4">
          <Menu
            aria-hidden="true"
            className={`absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
              isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            }`}
          />
          <X
            aria-hidden="true"
            className={`absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
              isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            }`}
          />
        </span>
      </button>

      {/* Overlay: always mounted so it can fade in and out. */}
      <button
        type="button"
        aria-label="Dismiss navigation overlay"
        aria-hidden={!isOpen}
        tabIndex={-1}
        onClick={() => setIsOpen(false)}
        className={`fixed inset-x-0 top-[68px] z-40 h-[calc(100dvh-68px)] cursor-default bg-[#03070b]/60 backdrop-blur-[3px] transition-opacity duration-300 ease-out motion-reduce:transition-none xl:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel: always mounted, animated with opacity, scale and translate. */}
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={`fixed right-4 top-[76px] z-50 flex w-[min(21rem,calc(100vw-2rem))] origin-top-right flex-col gap-1 border border-slate-800 bg-[#0c131d] p-2 shadow-[0_20px_55px_-24px_rgba(0,0,0,0.95)] transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.2,0.75,0.25,1)] motion-reduce:transition-none xl:hidden ${
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-2 scale-[0.97] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/90 px-3 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
            Navigate
          </span>
          <span className="font-mono text-[9px] text-slate-600">
            {String(items.length).padStart(2, "0")} LINKS
          </span>
        </div>
        <div className="flex flex-col gap-1 pt-1">
          <NavigationItems
            items={items}
            pathname={pathname}
            onNavigate={() => setIsOpen(false)}
            mobile
            open={isOpen}
          />
        </div>
      </nav>
    </div>
  );
}
