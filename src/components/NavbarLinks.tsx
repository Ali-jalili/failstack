"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarLinkItem {
  label: string;
  href: string;
  primary?: boolean;
}

export default function NavbarLinks({
  items,
}: {
  items: NavbarLinkItem[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={`${item.label}:${item.href}`}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              item.primary
                ? "rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-4 sm:text-sm"
                : `rounded-lg px-2.5 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:px-3.5 sm:text-sm ${
                    isActive
                      ? "border border-slate-700/50 bg-slate-800/80 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
