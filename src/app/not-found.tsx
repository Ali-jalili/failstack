/** @format */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Radio, ScanSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found | FailStack",
  description:
    "This route is missing from the FailStack incident observatory.",
};

const signalPoints = [
  { label: "REQUEST", state: "received" },
  { label: "ROUTE", state: "unresolved" },
  { label: "DESTINATION", state: "unavailable" },
] as const;

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[min(760px,calc(100svh-8rem))] items-center overflow-hidden bg-[#080d16] text-slate-100">
      <div
        aria-hidden="true"
        className="site-grid-surface pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-[#c6e47c]/[0.07]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full border border-[#c6e47c]/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-96 w-96 -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#c6e47c]/[0.045] blur-3xl"
      />

      <section className="relative mx-auto grid w-full max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.8fr] lg:gap-20 lg:px-12 lg:py-28">
        <section aria-labelledby="not-found-heading" className="max-w-2xl">
          <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#c6e47c]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rotate-45 border border-[#c6e47c] bg-[#c6e47c]/20"
            />
            FailStack · Failure Observatory
          </p>

          <div className="mt-9 flex items-end gap-4 sm:gap-6">
            <h1
              id="not-found-heading"
              className="font-serif text-[clamp(7rem,20vw,15rem)] font-normal leading-[0.72] tracking-[-0.09em] text-[#f1f1e9]"
            >
              404
            </h1>
            <span className="mb-1 inline-flex items-center gap-2 border border-rose-300/20 bg-rose-300/[0.05] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-rose-200/80 sm:mb-2">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300"
              />
              Route lost
            </span>
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Signal received. Destination not found.
          </p>
          <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight tracking-[-0.035em] text-slate-100 sm:text-4xl">
            This page fell out of the timeline.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
            The address may be outdated, or the route may never have existed.
            Either way, the incident archive is still intact.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="group inline-flex min-h-12 items-center gap-5 border border-[#c6e47c] bg-[#c6e47c] px-4 text-[12px] font-semibold text-[#11190a] transition-colors hover:border-[#dcf7a0] hover:bg-[#dcf7a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
            >
              <ArrowLeft aria-hidden className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Return to observatory
            </Link>
            <Link
              href="/incidents"
              className="inline-flex min-h-12 items-center gap-3 border border-slate-700/80 bg-white/[0.02] px-4 text-[12px] font-medium text-slate-200 transition-colors hover:border-[#c6e47c]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
            >
              Browse incident archive
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-[#c6e47c]" />
            </Link>
          </div>
        </section>

        <aside
          aria-label="Route diagnostics"
          className="relative mx-auto w-full max-w-[31rem] lg:justify-self-end"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-8 rounded-full border border-dashed border-slate-700/30"
          />
          <div className="relative border border-slate-700/80 bg-[#0b111b]/95 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-slate-800/90 px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <Radio aria-hidden className="h-3.5 w-3.5 text-[#c6e47c]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-300">
                  Route diagnostics
                </span>
              </div>
              <span className="font-mono text-[9px] tabular-nums text-slate-600">
                FS / 404
              </span>
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <div className="flex items-start gap-3 border border-slate-800/90 bg-[#080d16]/80 p-3.5">
                <ScanSearch
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#c6e47c]"
                />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                    Lookup result
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] leading-5 text-slate-200">
                    No matching route in this system
                  </p>
                </div>
                <span className="ml-auto shrink-0 border border-rose-300/20 px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-rose-200/75">
                  404
                </span>
              </div>

              <ol className="mt-7">
                {signalPoints.map((point, index) => {
                  const isLost = point.state === "unresolved";
                  const isLast = index === signalPoints.length - 1;

                  return (
                    <li key={point.label} className="relative flex min-h-[4.25rem] gap-4">
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[5px] top-3 h-[3.25rem] w-px ${
                            isLost ? "bg-rose-300/35" : "bg-[#c6e47c]/30"
                          }`}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={`relative mt-1 h-[11px] w-[11px] shrink-0 border ${
                          isLost
                            ? "border-rose-300 bg-rose-300/15 shadow-[0_0_16px_rgba(253,164,175,0.2)]"
                            : "border-[#c6e47c]/70 bg-[#c6e47c]/10"
                        }`}
                      />
                      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.13em] ${
                            isLost ? "text-rose-200/90" : "text-slate-400"
                          }`}
                        >
                          {point.label}
                        </span>
                        <span className="font-mono text-[9px] text-slate-600">
                          {point.state}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/90 px-4 py-3 sm:px-5">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-600">
                No data lost
              </span>
              <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#9cb876]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rotate-45 bg-[#c6e47c]"
                />
                System operational
              </span>
            </div>
          </div>

          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
            A missing route is not a missing lesson.
          </p>
        </aside>
      </section>
    </div>
  );
}
