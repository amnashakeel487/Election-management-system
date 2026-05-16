import { Link } from 'react-router-dom'
import { LANDING_ASSETS } from '@/constants/designAssets'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-20 sm:px-margin sm:pb-16 sm:pt-24 md:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18] sm:opacity-25"
          src={LANDING_ASSETS.heroBanner}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">public</span>
          <span className="font-label-md text-label-md font-semibold tracking-wide text-primary">Public election hub</span>
        </div>
        <h1 className="mb-4 text-balance font-headline-xl text-[2rem] font-black leading-tight tracking-tight text-on-surface sm:text-5xl md:text-6xl md:leading-[1.05]">
          Upcoming, live, and <span className="text-primary">completed</span> elections
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-pretty font-body-md text-body-md text-on-surface-variant sm:text-lg">
          Explore open polls on FortressVote—see timing, registration, and ballot totals where released—then jump into
          details to register or vote when eligible.
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <a
            href="#elections-catalog"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-label-md font-bold text-on-primary shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:px-8 sm:py-4"
          >
            View elections
            <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
          </a>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-surface-container-high px-6 py-3.5 font-label-md font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-surface-container-highest sm:px-8 sm:py-4"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 font-label-md font-semibold text-primary underline-offset-4 hover:underline sm:py-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
