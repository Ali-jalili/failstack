"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, X } from "lucide-react";

interface NavbarLinkItem {
  label: string;
  href: string;
  primary?: boolean;
  placement?: "action";
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/incidents") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        pathname !== "/incidents/new" &&
        !pathname.startsWith("/incidents/new/"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationItems({
  items,
  pathname,
  mobile = false,
  onNavigate,
}: {
  items: NavbarLinkItem[];
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return items.map((item) => {
    const active = isRouteActive(pathname, item.href);

    return (
      <Link
        key={`${item.label}:${item.href}`}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={[
          "group relative flex min-h-10 items-center gap-2 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d12]",
          item.primary
            ? "rounded-[3px] bg-[#c6e47c] px-3.5 font-semibold text-[#17200d] hover:bg-[#d6ee9c]"
            : active
              ? "text-slate-100"
              : "text-slate-400 hover:text-slate-100",
          mobile ? "w-full justify-between border-b border-slate-800/60 px-3.5" : "px-2",
        ].join(" ")}
      >
        <span className="flex items-center gap-2">
          {mobile && item.primary && (
            <Plus aria-hidden="true" className="h-4 w-4 text-[#263317]" />
          )}
          {item.label}
        </span>
        {item.primary && !mobile && (
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        )}
        {!item.primary && active && !mobile && (
          <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-px bg-[#c6e47c]" />
        )}
        {!item.primary && active && mobile && (
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#c6e47c]" />
        )}
      </Link>
    );
  });
}

export default function NavbarLinks({ items }: { items: NavbarLinkItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const desktopNavigation = items.filter(
    (item) => !item.primary && item.placement !== "action",
  );
  const desktopActions = items.filter(
    (item) => item.primary || item.placement === "action",
  );

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="relative flex min-w-0 flex-1 items-center justify-end lg:block">
      <div className="hidden w-full items-center lg:flex">
        <nav aria-label="Main navigation" className="flex min-w-0 flex-1 items-center justify-center gap-4">
          <NavigationItems items={desktopNavigation} pathname={pathname} />
        </nav>
        {desktopActions.length > 0 && (
          <nav
            aria-label="Account actions"
            className="flex items-center gap-3 border-l border-slate-800 pl-5"
          >
            <NavigationItems items={desktopActions} pathname={pathname} />
          </nav>
        )}
      </div>

      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 items-center gap-2 rounded-sm px-2.5 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d12] motion-reduce:transition-none lg:hidden"
      >
        {isOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
        <span className="hidden min-[360px]:inline">{isOpen ? "Close" : "Menu"}</span>
      </button>

      <button
        type="button"
        aria-label="Dismiss navigation overlay"
        aria-hidden={!isOpen}
        tabIndex={-1}
        onClick={() => setIsOpen(false)}
        className={`fixed inset-x-0 top-[68px] z-40 h-[calc(100dvh-68px)] cursor-default bg-[#03070b]/60 transition-opacity duration-150 motion-reduce:transition-none lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={`fixed right-3 top-[76px] z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col rounded-md border border-slate-800 bg-[#0c1118] p-2 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.9)] transition-[opacity,transform,visibility] duration-150 motion-reduce:transition-none lg:hidden ${isOpen ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"}`}
      >
        <div className="border-b border-slate-800/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
          FailStack navigation
        </div>
        <div className="flex flex-col gap-0.5 pt-1">
          <NavigationItems
            items={items}
            pathname={pathname}
            onNavigate={() => setIsOpen(false)}
            mobile
          />
        </div>
      </nav>
    </div>
  );
}
