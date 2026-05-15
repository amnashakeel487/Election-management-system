export function Footer() {
  return (
    <footer className="flex w-full flex-col items-center justify-between border-t border-white/5 bg-surface-container-lowest px-margin py-xl md:flex-row">
      <div className="mb-8 flex flex-col items-center gap-2 md:mb-0 md:items-start">
        <span className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface">
          FortressVote
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2024 FortressVote Secure Systems. All Rights Reserved.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
          Privacy Policy
        </a>
        <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
          Terms of Service
        </a>
        <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
          Security Audit
        </a>
        <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
          Voter Rights
        </a>
      </div>
      <div className="mt-8 flex gap-4 md:mt-0">
        <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-surface-container-high text-on-surface-variant transition-colors hover:text-primary">
          <span className="material-symbols-outlined text-lg">public</span>
        </div>
        <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-surface-container-high text-on-surface-variant transition-colors hover:text-primary">
          <span className="material-symbols-outlined text-lg">shield_with_heart</span>
        </div>
      </div>
    </footer>
  )
}
