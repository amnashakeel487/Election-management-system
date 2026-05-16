export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-20 sm:px-margin sm:pb-16 sm:pt-24 md:pt-28">
      {/* Deep gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgb(15, 35, 71) 0%, rgb(27, 58, 107) 45%, rgb(45, 27, 105) 100%)',
        }}
      />

      {/* Floating blobs */}
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#6C3FC5] opacity-15 blur-3xl animate-blob"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#06B6D4] opacity-15 blur-3xl animate-blob"
        style={{ animationDelay: '-6s' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-10 h-48 w-48 rounded-full bg-tertiary opacity-[0.12] blur-2xl animate-blob"
        style={{ animationDelay: '-12s' }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center animate-fade-in-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-on-nav/20 bg-on-nav/10 px-3 py-1.5 backdrop-blur-sm">
          <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
          <span className="font-label-md text-label-md font-bold tracking-wide text-on-nav">Verified platform</span>
        </div>
        <h1 className="mb-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.5px] text-on-nav sm:text-5xl md:text-6xl">
          Upcoming, live, and completed elections
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-on-nav/75 sm:text-xl">
          Browse public polls—see schedules, registration, and official ballot counts when released—then open details
          to register or vote.
        </p>
        <div className="mb-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <a
            href="#elections-catalog"
            className="btn-gradient-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base shadow-primary-glow sm:py-4"
          >
            View elections
            <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
          </a>
          <a
            href="#elections-catalog"
            className="btn-ghost inline-flex items-center justify-center border-on-nav/30 bg-on-nav/5 px-8 py-3.5 text-on-nav backdrop-blur-sm hover:border-on-nav/50 hover:bg-on-nav/10 hover:text-on-nav sm:py-4"
          >
            Search &amp; filter
          </a>
        </div>

        {/* Trust badges — green chip style */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-status-active-bg px-3 py-1.5 font-label-sm font-semibold text-status-active-fg ring-1 ring-status-active-fg/15">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Encrypted ballots
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-status-active-bg px-3 py-1.5 font-label-sm font-semibold text-status-active-fg ring-1 ring-status-active-fg/15">
            <span className="material-symbols-outlined text-[18px]">shield</span>
            Role-based access
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-status-active-bg px-3 py-1.5 font-label-sm font-semibold text-status-active-fg ring-1 ring-status-active-fg/15">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Audit-friendly
          </span>
        </div>
      </div>
    </section>
  )
}
