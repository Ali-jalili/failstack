/** @format */

import Link from "next/link";

export default function Home() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Grid Pattern & Glows */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[10%] top-[40%] h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-xs font-medium tracking-wider text-slate-300 uppercase">
                Software Incident Analysis Platform
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
              Failures are data.
              <br />
              <span className="bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 bg-clip-text text-transparent">
                Study them.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Explore real-world production outages through structured
              timelines, root-cause trees, architecture diffs, and prevention
              strategies.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/explorer"
                className="group relative inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 shadow-lg shadow-blue-600/25"
              >
                Explore Incidents
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <Link
                href="/author"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-6 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
              >
                Document a Failure
              </Link>
            </div>

            {/* Platform Capabilities */}
            <div className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-800/80 pt-6">
              <div>
                <p className="font-mono text-lg font-bold text-slate-200">
                  01. Timeline
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Offset-based progression
                </p>
              </div>

              <div className="border-l border-slate-800/80 pl-6">
                <p className="font-mono text-lg font-bold text-slate-200">
                  02. RCA Tree
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Structured causality
                </p>
              </div>

              <div className="border-l border-slate-800/80 pl-6">
                <p className="font-mono text-lg font-bold text-slate-200">
                  03. Arch Diff
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Fact vs Reconstruction
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Case Study Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
                    CRITICAL SEVERITY
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-500">
                  Cascading Failure
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <h3 className="text-lg font-semibold text-slate-100">
                  Global API Gateway Connection Pool Exhaustion
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A sudden spike in authentication requests triggered retry
                  storms, depleting PostgreSQL connections and taking down
                  downstreams.
                </p>
              </div>

              {/* Interactive Mini Timeline Preview */}
              <div className="mt-6 space-y-2.5 rounded-lg border border-slate-800/50 bg-slate-950/60 p-3.5 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-emerald-400">T+00m [TRIGGER]</span>
                  <span>Auth retry storm begins</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-amber-400">T+12m [IMPACT]</span>
                  <span>Pool connections hit 100%</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-blue-400">T+45m [MITIGATION]</span>
                  <span>Rate limiting enforced</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                <span>Technologies: Redis, PostgreSQL, Node.js</span>
                <span className="text-blue-400 font-medium hover:underline cursor-pointer">
                  Analyze Case Study →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
