/** @format */

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Info */}
          <div className="md:col-span-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-xs font-mono font-bold text-blue-400">
                FS
              </div>
              <span className="text-base font-semibold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                FailStack
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              A structured knowledge base to analyze real-world software
              failures, root causes, and architectural evolution.
            </p>

            {/* Status Indicator */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/50 px-3 py-1 font-mono text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform
            </span>
            <Link
              href="/explorer"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              Explorer
            </Link>
            <Link
              href="/author"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              Document Failure
            </Link>
          </div>

          {/* Categories / Tags */}
          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              Focus Areas
            </span>
            <span className="text-sm text-slate-400">Root Cause Analysis</span>
            <span className="text-sm text-slate-400">Architecture Diffs</span>
            <span className="text-sm text-slate-400">Cascading Failures</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800/60 pt-6 sm:flex-row">
          <span className="font-mono text-xs text-slate-500">
            FAILSTACK &copy; {new Date().getFullYear()} — Built for engineers
          </span>

          <span className="mt-2 font-mono text-xs text-slate-500 sm:mt-0">
            Failures are data.
          </span>
        </div>
      </div>
    </footer>
  );
}
