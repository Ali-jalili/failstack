export default function ReviewIncidentsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading reviewer workspace"
      className="home-page relative isolate min-h-[calc(100dvh-68px)] overflow-hidden bg-[#080d16] px-5 py-9 text-slate-100 sm:px-8 sm:py-12 lg:px-10 lg:py-14"
    >
      <div aria-hidden="true" className="home-grid" />
      <div className="relative mx-auto max-w-[1240px]">
        <p role="status" className="sr-only">Loading incidents awaiting review</p>
        <header aria-hidden="true" className="mb-8 border-b border-slate-800/80 pb-7">
          <div className="h-3 w-48 animate-pulse bg-slate-800 motion-reduce:animate-none" />
          <div className="mt-5 h-14 w-80 max-w-full animate-pulse bg-slate-800 motion-reduce:animate-none sm:h-16" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse bg-slate-900 motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-3/4 max-w-lg animate-pulse bg-slate-900 motion-reduce:animate-none" />
        </header>

        <div aria-hidden="true" className="grid min-w-0 gap-7 lg:grid-cols-[minmax(15rem,0.31fr)_minmax(0,1fr)] lg:gap-9">
          <aside className="min-w-0">
            <div className="flex items-end justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="h-3 w-24 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                <div className="mt-2 h-5 w-36 animate-pulse bg-slate-800 motion-reduce:animate-none" />
              </div>
              <div className="h-4 w-5 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            </div>
            <ol className="divide-y divide-slate-800/70">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="py-4 pl-4">
                  <div className="h-3 w-16 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                  <div className="mt-3 h-5 w-full max-w-sm animate-pulse bg-slate-900 motion-reduce:animate-none" />
                  <div className="mt-2 h-3 w-40 animate-pulse bg-slate-900 motion-reduce:animate-none" />
                  <div className="mt-3 h-3 w-32 animate-pulse bg-slate-900 motion-reduce:animate-none" />
                </li>
              ))}
            </ol>
          </aside>

          <section className="min-w-0 border-y border-slate-800/80 px-5 py-6 sm:px-7 sm:py-8">
            <div className="h-3 w-40 animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-5 h-10 w-full max-w-2xl animate-pulse bg-slate-800 motion-reduce:animate-none" />
            <div className="mt-3 h-4 w-48 animate-pulse bg-slate-900 motion-reduce:animate-none" />
            <div className="mt-6 h-4 w-full max-w-3xl animate-pulse bg-slate-900 motion-reduce:animate-none" />
            <div className="mt-2 h-4 w-4/5 max-w-2xl animate-pulse bg-slate-900 motion-reduce:animate-none" />
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <div className="h-3 w-20 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                  <div className="mt-2 h-4 w-28 animate-pulse bg-slate-900 motion-reduce:animate-none" />
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-slate-800 pt-6">
              <div className="h-3 w-36 animate-pulse bg-slate-800 motion-reduce:animate-none" />
              <div className="mt-5 grid gap-6 md:grid-cols-[minmax(9rem,0.38fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="h-9 animate-pulse bg-slate-900 motion-reduce:animate-none" />
                  ))}
                </div>
                <div className="min-h-32 border-l border-slate-800 pl-5">
                  <div className="h-3 w-32 animate-pulse bg-slate-800 motion-reduce:animate-none" />
                  <div className="mt-4 h-5 w-3/4 animate-pulse bg-slate-900 motion-reduce:animate-none" />
                  <div className="mt-3 h-4 w-full animate-pulse bg-slate-900 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
