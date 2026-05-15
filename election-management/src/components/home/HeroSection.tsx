import { LANDING_ASSETS } from '@/constants/designAssets'

export function HeroSection() {
  return (
    <section className="relative flex min-h-[870px] items-center overflow-hidden px-margin">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <img
          alt="Secure Democracy Banner"
          className="h-full w-full object-cover opacity-40"
          src={LANDING_ASSETS.heroBanner}
        />
      </div>
      <div className="relative z-20 max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
          <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
          <span className="font-label-md text-label-md text-primary">MILITARY-GRADE ENCRYPTION</span>
        </div>
        <h1 className="mb-6 text-[64px] font-black leading-[72px] tracking-tight text-on-surface">
          The Future of <span className="text-primary">Secure Democracy</span>
        </h1>
        <p className="mb-10 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
          FortressVote leverages blockchain integrity and multi-factor biometric verification to ensure every
          voice is heard, every vote is counted, and every election is immutable.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl bg-primary px-8 py-4 font-headline-md text-headline-md text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
          >
            View Active Elections
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-outline px-8 py-4 font-headline-md text-headline-md text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            Our Security Audit
          </button>
        </div>
      </div>
    </section>
  )
}
