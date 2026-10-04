/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Explorer", href: "/explorer" },
  { label: "Create Incident", href: "/incidents/new" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 shadow-inner transition-all duration-200 group-hover:border-blue-500/50 group-hover:bg-slate-800">
            <span className="font-mono text-xs font-bold tracking-wider text-blue-400 group-hover:text-blue-300">
              FS
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors">
              FailStack
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Incident Knowledge Base
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isCTA = item.href === "/author";

            if (isCTA) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/30"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-800/80 text-white border border-slate-700/50"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
