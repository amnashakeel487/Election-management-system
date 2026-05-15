import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ELECTION_SECURITY_GRAPHIC } from '@/constants/electionAssets'
import { CreatorSidebar } from './CreatorSidebar'

const STEPS = [
  { id: 1, label: 'Identity Setup' },
  { id: 2, label: 'Timing & Duration' },
  { id: 3, label: 'Governance & Rules' },
  { id: 4, label: 'Final Verification' },
] as const

interface CreatorWizardShellProps {
  currentStep: number
  children: ReactNode
  sidebar?: ReactNode
  footerActions?: ReactNode
}

export function CreatorWizardShell({
  currentStep,
  children,
  sidebar,
  footerActions,
}: CreatorWizardShellProps) {
  const mobileProgress = ((currentStep - 1) / 3) * 100

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-surface/70 px-8 shadow-sm backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            how_to_vote
          </span>
          <span>FortressVote</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          <a className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#">
            Elections
          </a>
          <a className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#">
            Results
          </a>
          <a className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary" href="#">
            Resources
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="font-body-md text-body-md text-on-surface transition-colors hover:text-primary">
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-primary px-6 py-2 font-body-md text-body-md text-on-primary transition-all active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <CreatorSidebar />

      <main className="min-h-screen pb-20 pt-24 lg:ml-[280px] lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 md:px-margin">
          <div className="mb-10">
            <h1 className="mb-2 font-headline-lg text-headline-lg font-bold text-on-surface md:text-headline-xl">
              Initialize Secure Election
            </h1>
            <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Configure the cryptographic parameters and jurisdictional rules for your high-integrity digital
              ballot.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <nav className="sticky top-24 hidden lg:col-span-3 lg:block">
              <div className="space-y-6">
                {STEPS.map((step) => {
                  const done = step.id < currentStep
                  const active = step.id === currentStep
                  return (
                    <div key={step.id} className="group flex items-center gap-4">
                      <div
                        className={
                          done || active
                            ? 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary'
                            : 'flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface bg-surface-container-highest text-on-surface-variant'
                        }
                      >
                        {done ? (
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        ) : (
                          <span className="font-bold">{step.id}</span>
                        )}
                      </div>
                      <div>
                        <p
                          className={
                            active
                              ? 'font-label-md text-label-md font-bold text-primary'
                              : 'font-label-md text-label-md text-on-surface-variant transition-colors group-hover:text-on-surface'
                          }
                        >
                          Step {step.id}
                        </p>
                        <p
                          className={
                            active || done
                              ? 'font-label-md text-label-md font-bold text-on-surface'
                              : 'font-label-md text-label-md font-bold text-on-surface-variant/50'
                          }
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </nav>

            <div className="space-y-6 lg:col-span-6">
              <div className="relative mb-8 flex items-center justify-between px-2 lg:hidden">
                <div className="absolute left-0 top-1/2 z-0 h-[2px] w-full -translate-y-1/2 bg-surface-container-highest" />
                <div
                  className="absolute left-0 top-1/2 z-0 h-[2px] -translate-y-1/2 bg-primary transition-all duration-500"
                  style={{ width: `${mobileProgress}%` }}
                />
                {STEPS.map((step) => {
                  const done = step.id < currentStep
                  const active = step.id === currentStep
                  return (
                    <div
                      key={step.id}
                      className={
                        done || active
                          ? 'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary'
                          : 'relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-xs font-bold text-on-surface-variant'
                      }
                    >
                      {done ? (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      ) : (
                        step.id
                      )}
                    </div>
                  )
                })}
              </div>

              {children}
              {footerActions}
            </div>

            <aside className="space-y-6 lg:col-span-3">
              {sidebar ?? (
                <>
                  <div className="glass-card rounded-[28px] border-primary/10 p-6">
                    <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl">
                      <img
                        alt="Election Security Graphic"
                        className="h-full w-full object-cover"
                        src={ELECTION_SECURITY_GRAPHIC}
                      />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                        <span className="rounded border border-primary/30 bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md">
                          Encryption Active
                        </span>
                      </div>
                    </div>
                    <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">Policy Summary</h3>
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-1.5 text-[20px] text-primary">
                          verified_user
                        </span>
                        <div>
                          <p className="font-label-md text-label-md font-bold text-on-surface">SOC-2 Type II</p>
                          <p className="text-[12px] leading-relaxed text-on-surface-variant">
                            Fully compliant with federal digital voting security standards.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined rounded-lg bg-tertiary/10 p-1.5 text-[20px] text-tertiary">
                          lock
                        </span>
                        <div>
                          <p className="font-label-md text-label-md font-bold text-on-surface">Quantum Resistant</p>
                          <p className="text-[12px] leading-relaxed text-on-surface-variant">
                            Lattice-based cryptography for multi-decade data integrity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/5 bg-surface-container-high/50 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">info</span>
                      <p className="font-label-md text-label-md font-bold text-on-surface">Compliance Tip</p>
                    </div>
                    <p className="text-[13px] leading-relaxed text-body-sm text-on-surface-variant">
                      Most municipal jurisdictions require Zero-Knowledge encryption for anonymized ballots. Ensure
                      your &quot;Rules&quot; match your local charter.
                    </p>
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-between border-t border-white/5 bg-surface-container-lowest px-margin py-xl lg:ml-[280px] md:flex-row">
        <div className="mb-6 text-center md:mb-0 md:text-left">
          <p className="font-label-md text-label-md font-bold text-on-surface">© 2024 FortressVote Secure Systems.</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
            Sovereign Voting Protocol v4.2
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Privacy
          </a>
          <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Terms
          </a>
          <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Audit
          </a>
          <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Rights
          </a>
        </div>
      </footer>
    </div>
  )
}
