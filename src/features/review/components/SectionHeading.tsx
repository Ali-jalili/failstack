/** @format */

"use client";

import type { LucideIcon } from "lucide-react";

export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#c6e47c]/25 bg-[#c6e47c]/10">
          <Icon className="h-3.5 w-3.5 text-[#c6e47c]" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {trailing}
    </div>
  );
}
