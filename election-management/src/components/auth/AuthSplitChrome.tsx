import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './signup-page.css'

export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

const PARTICLE_COUNT = 28

export type AuthSplitVariant = 'login' | 'register'

interface AuthSplitChromeProps {
  variant: AuthSplitVariant
  children: ReactNode
}

export function AuthSplitChrome({ variant, children }: AuthSplitChromeProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        duration: `${8 + Math.random() * 14}s`,
        delay: `${Math.random() * 12}s`,
        dx: `${(Math.random() - 0.5) * 120}px`,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    [],
  )

  const leftEyebrow = variant === 'login' ? 'Encrypted access' : 'Secure registration'

  return (
    <div className="sp-root text-slate-900">
      <div className="sp-bg-scene" aria-hidden>
        <div className="sp-grid-lines" />
        <div className="sp-orb sp-orb1" />
        <div className="sp-orb sp-orb2" />
        <div className="sp-orb sp-orb3" />
        <div className="absolute inset-0" aria-hidden>
          {particles.map((p) => (
            <div
              key={p.key}
              className="sp-particle"
              style={{
                left: p.left,
                animationDuration: p.duration,
                animationDelay: p.delay,
                ['--sp-dx' as string]: p.dx,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
      </div>

      <nav className="sp-nav-bar">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-gradient-to-br from-[#2451A3] to-[#6C3FC5]">
            <ShieldIcon className="h-[13px] w-[13px] text-white" />
          </div>
          <span className="text-[13px] font-extrabold text-white">FortressVote</span>
        </Link>
        <div className="sp-nav-links flex gap-5">
          <Link to="/" className="cursor-pointer text-[12px] font-medium text-white/50 transition-colors hover:text-white">
            Home
          </Link>
          <Link
            to="/browse-elections"
            className="cursor-pointer text-[12px] font-medium text-white/50 transition-colors hover:text-white"
          >
            Elections
          </Link>
          <Link
            to="/account/security"
            className="cursor-pointer text-[12px] font-medium text-white/50 transition-colors hover:text-white"
          >
            Security
          </Link>
        </div>
        {variant === 'register' ? (
          <Link
            to="/login"
            className="cursor-pointer rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/register"
            className="cursor-pointer rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[12px] font-bold text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            Create account
          </Link>
        )}
      </nav>

      <div className="sp-page-wrap">
        <div className="sp-left">
          <div className="flex items-center gap-3">
            <div className="sp-brand-icon-pulse flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-[#2451A3] to-[#6C3FC5] shadow-lg shadow-purple-500/40">
              <ShieldIcon className="h-[22px] w-[22px] text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">FortressVote</span>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-300">
              Enterprise
            </span>
          </div>

          <div className="mt-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5">
              <div className="sp-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold tracking-wide text-emerald-300">{leftEyebrow}</span>
            </div>
            <h1 className="mb-4 text-[42px] font-extrabold leading-[1.15] tracking-tight text-white">
              Democracy
              <br />
              powered by
              <br />
              <span className="sp-grad-text">military-grade</span>
              <br />
              security
            </h1>
            <p className="max-w-[380px] text-[15px] leading-relaxed text-white/55">
              Verified voter registration, anonymous ballots, and role-based dashboards for voters, election creators,
              and administrators.
            </p>

            <div className="mt-11 flex gap-7">
              <div>
                <div className="font-mono text-[26px] font-extrabold text-white">2,847+</div>
                <div className="mt-0.5 text-[11px] font-medium text-white/35">Elections hosted</div>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="font-mono text-[26px] font-extrabold text-white">1.2M+</div>
                <div className="mt-0.5 text-[11px] font-medium text-white/35">Registered voters</div>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="font-mono text-[26px] font-extrabold text-white">99.9%</div>
                <div className="mt-0.5 text-[11px] font-medium text-white/35">Uptime focus</div>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-3.5">
              <div className="sp-feat-row d1 flex items-center gap-3.5 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 transition-all hover:border-cyan-400/20 hover:bg-white/[0.07]">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-cyan-400/20 bg-cyan-400/10">
                  <span className="material-symbols-outlined text-lg text-cyan-300">lock</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">AES-256 &amp; secure transport</div>
                  <div className="text-[11px] leading-snug text-white/35">Sensitive actions use modern TLS and Supabase Auth.</div>
                </div>
              </div>
              <div className="sp-feat-row d2 flex items-center gap-3.5 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 transition-all hover:border-cyan-400/20 hover:bg-white/[0.07]">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-cyan-400/20 bg-cyan-400/10">
                  <span className="material-symbols-outlined text-lg text-cyan-300">receipt_long</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">Audit-ready activity</div>
                  <div className="text-[11px] leading-snug text-white/35">Administrative actions can be logged for review.</div>
                </div>
              </div>
              <div className="sp-feat-row d3 flex items-center gap-3.5 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-4 py-3.5 transition-all hover:border-cyan-400/20 hover:bg-white/[0.07]">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-cyan-400/20 bg-cyan-400/10">
                  <span className="material-symbols-outlined text-lg text-cyan-300">groups</span>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">Multi-role access</div>
                  <div className="text-[11px] leading-snug text-white/35">Voters and election creators start here; admins are provisioned separately.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-white/[0.07] pt-9">
            {['SOC 2 ready posture', 'GDPR-aware flows', 'TLS 1.2+', 'No password reuse hints'].map((t) => (
              <div
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-emerald-400/18 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="sp-right">{children}</div>
      </div>
    </div>
  )
}
