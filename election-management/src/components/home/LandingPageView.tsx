import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldIcon } from '@/components/auth/AuthSplitChrome'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { LandingElectionsSection } from './LandingElectionsSection'
import { useLandingCounter, useLandingReveal } from './useLandingReveal'
import './landing-page.css'

const PARTICLE_COUNT = 32

const FEATURES = [
  {
    border: '#1B3A6B',
    iconBg: '#EFF4FF',
    iconStroke: '#1B3A6B',
    link: '#1B3A6B',
    delay: '0s',
    title: 'Military-grade encryption',
    desc: 'AES-256 end-to-end encryption helps keep every vote private and tamper-resistant from cast to count.',
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    border: '#6C3FC5',
    iconBg: '#F5F3FF',
    iconStroke: '#6C3FC5',
    link: '#6C3FC5',
    delay: '0.1s',
    title: 'Real-time audit logs',
    desc: 'Administrative actions can be logged for review so oversight teams have a clear accountability trail.',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    border: '#06B6D4',
    iconBg: '#ECFEFF',
    iconStroke: '#06B6D4',
    link: '#06B6D4',
    delay: '0.2s',
    title: 'Multi-role platform',
    desc: 'Purpose-built dashboards for admins, election creators, and voters — each with the right level of access.',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    border: '#10B981',
    iconBg: '#ECFDF5',
    iconStroke: '#10B981',
    link: '#10B981',
    delay: '0.3s',
    title: 'Live countdown & results',
    desc: 'Real-time tallies when enabled, progress indicators, and published results after polls close.',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  {
    border: '#F59E0B',
    iconBg: '#FFFBEB',
    iconStroke: '#F59E0B',
    link: '#F59E0B',
    delay: '0.4s',
    title: 'Secret voter ID system',
    desc: 'Unique voter credentials support anonymous, duplicate-free participation across elections.',
    icon: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  },
  {
    border: '#EF4444',
    iconBg: '#FEF2F2',
    iconStroke: '#EF4444',
    link: '#EF4444',
    delay: '0.5s',
    title: 'Enterprise security monitor',
    desc: 'Optional MFA, session review, and account security tools to protect high-stakes elections.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
] as const

const HOW_STEPS = [
  { n: '01', title: 'Create your election', desc: 'Set up title, dates, candidates and voting rules with our guided form.' },
  { n: '02', title: 'Invite voters', desc: 'Share secret voter IDs via email or CSV upload. Voters register securely in minutes.' },
  { n: '03', title: 'Cast votes securely', desc: 'Voters authenticate and cast anonymous encrypted ballots during the voting window.' },
  { n: '04', title: 'Get instant results', desc: 'Live charts when enabled, winner summaries, and audit-ready reports after close.' },
] as const

const TESTIMONIALS = [
  {
    featured: false,
    initials: 'AO',
    gradient: 'linear-gradient(135deg,#1B3A6B,#2451A3)',
    name: 'Dr. Amara Osei',
    role: 'Vice Chancellor, Tech University',
    quote:
      'FortressVote transformed how we run student elections. The transparency and security gave our community confidence in the results.',
  },
  {
    featured: true,
    initials: 'JW',
    gradient: 'linear-gradient(135deg,#6C3FC5,#4C1D95)',
    name: 'James Whitfield',
    role: 'Director, National Elections Office',
    quote:
      'We ran a large-scale election without a single integrity issue. Audit logs gave our oversight committee complete confidence in the outcome.',
  },
  {
    featured: false,
    initials: 'PS',
    gradient: 'linear-gradient(135deg,#06B6D4,#0891B2)',
    name: 'Priya Sharma',
    role: 'CEO, Enterprise Solutions Ltd',
    quote:
      'The secret voter ID system is brilliant. Board elections stay anonymous yet auditable — setup took under thirty minutes.',
  },
] as const

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function LandingPageView() {
  const navigate = useNavigate()
  const { session, profile, getDashboardPath, mfaRequired } = useAuth()
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [barsReady, setBarsReady] = useState(false)

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        duration: `${10 + Math.random() * 16}s`,
        delay: `${Math.random() * 14}s`,
        dx: `${(Math.random() - 0.5) * 100}px`,
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
      })),
    [],
  )

  useLandingReveal(true)
  useLandingCounter(true)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setBarsReady(true), 800)
    return () => window.clearTimeout(t)
  }, [])

  const signedIn = Boolean(session && profile && !mfaRequired)
  const dashboardPath = getDashboardPath() ?? '/'

  return (
    <div className="lp-root">
      <nav className={`navbar${navScrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <div className="nav-icon">
            <ShieldIcon className="h-5 w-5 text-white" />
          </div>
          <span className="nav-name">FortressVote</span>
          <span className="nav-tag">Enterprise</span>
        </Link>

        <NavLinks mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} showLangInMobile />

        <div className="nav-actions">
          <LanguageSwitcher variant="nav" className="nav-lang" />
          {signedIn ? (
            <button type="button" className="btn-primary-nav" onClick={() => navigate(dashboardPath)}>
              Dashboard →
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost-nav" onClick={() => navigate('/login')}>
                Log in
              </button>
              <button type="button" className="btn-primary-nav" onClick={() => navigate('/register')}>
                Get Started →
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav-hamburger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <section className="hero">
        <div className="hero-bg">
          <div className="grid-lines" />
          <div className="orb o1" />
          <div className="orb o2" />
          <div className="orb o3" />
          <div className="particles">
            {particles.map((p) => (
              <div
                key={p.key}
                className="particle"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  animationDuration: p.duration,
                  animationDelay: p.delay,
                  ['--dx' as string]: p.dx,
                  opacity: p.opacity,
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-inner">
          <div className="hero-left">
            <div className="live-badge">
              <div className="live-dot" />
              <span>Elections open for registration</span>
            </div>
            <h1 className="hero-title">
              Democracy
              <br />
              <span className="line2">Powered by</span>
              <br />
              <span className="grad-text">Military-Grade</span>
              <br />
              Security
            </h1>
            <p className="hero-sub">
              End-to-end encrypted, audit-ready, tamper-resistant elections for organisations of any size. Built for
              universities, enterprises, and public institutions.
            </p>
            <div className="hero-btns">
              <button type="button" className="btn-hero-primary" onClick={() => navigate(signedIn ? dashboardPath : '/register')}>
                <span className="shimmer" />
                <CheckIcon />
                {signedIn ? 'Go to dashboard' : 'Start free election'}
              </button>
              <button type="button" className="btn-hero-ghost" onClick={() => navigate('/#elections-catalog')}>
                <PlayIcon />
                Browse elections
              </button>
            </div>
            <div className="trust-chips">
              {['AES-256 encrypted', 'Role-based access', 'GDPR-aware flows', 'SOC 2 ready posture'].map((t) => (
                <div key={t} className="t-chip">
                  <CheckIcon />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="hero-right">
            <DashboardPreview barsReady={barsReady} />
          </div>
        </div>
      </section>

      <div className="stats-strip">
        <div className="stats-inner">
          <div className="stat-col reveal">
            <div className="stat-num-big" data-target="2847">
              0
            </div>
            <div className="stat-label-big">Elections conducted</div>
            <div className="stat-delta">Platform scale</div>
          </div>
          <div className="stat-col reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="stat-num-big">1.2M+</div>
            <div className="stat-label-big">Registered voters</div>
            <div className="stat-delta">Growing community</div>
          </div>
          <div className="stat-col reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="stat-num-big">99.9%</div>
            <div className="stat-label-big">Uptime focus</div>
            <div className="stat-delta">Reliable infrastructure</div>
          </div>
          <div className="stat-col reveal" style={{ transitionDelay: '0.3s' }}>
            <div className="stat-num-big">Zero</div>
            <div className="stat-label-big">Known breaches</div>
            <div className="stat-delta">Security first</div>
          </div>
        </div>
      </div>

      <LandingElectionsSection />

      <section className="features-section section" id="features">
        <div className="section-inner">
          <div style={{ maxWidth: 560 }} className="reveal">
            <div className="section-eyebrow">Why choose us</div>
            <h2 className="section-title">
              Everything you need for
              <br />
              <span className="accent">secure elections</span>
            </h2>
            <p className="section-sub">A complete platform built for security, transparency, and scale.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="feat-card reveal"
                style={{ borderTop: `4px solid ${f.border}`, transitionDelay: f.delay }}
              >
                <div className="feat-icon" style={{ background: f.iconBg }}>
                  <svg style={{ stroke: f.iconStroke }} viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
                <Link to="/register" className="feat-link" style={{ color: f.link }}>
                  Learn more <ArrowIcon />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section section" id="how">
        <div className="section-inner">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }} className="reveal">
            <div className="section-eyebrow" style={{ color: 'var(--cyan)' }}>
              Simple process
            </div>
            <h2 className="section-title" style={{ color: '#fff' }}>
              How it works in
              <br />
              <span style={{ color: 'var(--cyan)' }}>4 easy steps</span>
            </h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.45)', margin: '0 auto' }}>
              From setup to results in minutes — no technical expertise required.
            </p>
          </div>
          <div className="how-grid">
            {HOW_STEPS.map((s, i) => (
              <div key={s.n} className="how-step reveal" style={{ transitionDelay: `${0.1 * (i + 1)}s` }}>
                <div className="how-num">{s.n}</div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testi-section section" id="testimonials">
        <div className="section-inner">
          <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }} className="reveal">
            <div className="section-eyebrow">Trusted worldwide</div>
            <h2 className="section-title">
              What our <span className="accent">customers</span> say
            </h2>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="testi-card reveal"
                style={{
                  transitionDelay: `${0.1 * (i + 1)}s`,
                  ...(t.featured ? { border: '2px solid rgba(36,81,163,0.2)' } : {}),
                }}
              >
                {t.featured ? (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#2451A3',
                      background: '#DBEAFE',
                      padding: '3px 10px',
                      borderRadius: 20,
                      display: 'inline-block',
                      marginBottom: 12,
                      letterSpacing: 0.5,
                    }}
                  >
                    FEATURED REVIEW
                  </div>
                ) : null}
                <div className="testi-stars">★★★★★</div>
                <div className="testi-text">&ldquo;{t.quote}&rdquo;</div>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ background: t.gradient }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orb1" />
        <div className="cta-orb2" />
        <div className="cta-inner reveal">
          <div className="live-badge" style={{ margin: '0 auto 24px' }}>
            <div className="live-dot" />
            <span>Free to start — no credit card needed</span>
          </div>
          <h2 className="cta-title">
            Ready to run your first
            <br />
            <span className="grad-text">secure election?</span>
          </h2>
          <p className="cta-sub">
            Join organisations that trust FortressVote for their most important democratic decisions.
          </p>
          <div className="cta-btns">
            <button type="button" className="btn-hero-primary" onClick={() => navigate('/register')}>
              <span className="shimmer" />
              <CheckIcon />
              Create free account
            </button>
            <button type="button" className="btn-hero-ghost" onClick={() => navigate('/login')}>
              <ChatIcon />
              Sign in
            </button>
          </div>
          <div className="cta-chip-row">
            {['Free to register', 'Setup in minutes', 'Email verification', 'Cancel anytime'].map((c) => (
              <div key={c} className="cta-chip">
                <CheckIcon />
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-row">
                <div className="footer-brand-icon">
                  <ShieldIcon className="h-[17px] w-[17px] text-white" />
                </div>
                <span className="footer-brand-name">FortressVote</span>
              </div>
              <p className="footer-desc">
                A secure election management platform. Built for transparency, designed for trust.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {['SOC 2', 'GDPR', 'TLS 1.2+'].map((chip) => (
                  <div key={chip} className="t-chip">
                    {chip}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Platform</div>
              <a className="footer-link" href="#elections-catalog">
                Elections
              </a>
              <Link className="footer-link" to="/results">
                Results
              </Link>
              <Link className="footer-link" to="/account/security">
                Security
              </Link>
            </div>
            <div>
              <div className="footer-col-title">Account</div>
              <Link className="footer-link" to="/login">
                Sign in
              </Link>
              <Link className="footer-link" to="/register">
                Register
              </Link>
              <Link className="footer-link" to="/forgot-password">
                Reset password
              </Link>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <a className="footer-link" href="/docs/AUTH_SETUP.md">
                Auth setup guide
              </a>
              <a className="footer-link" href="#features">
                Features
              </a>
              <a className="footer-link" href="#how">
                How it works
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© {new Date().getFullYear()} FortressVote. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLinks({
  mobileOpen,
  setMobileOpen,
  showLangInMobile = false,
}: {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  showLangInMobile?: boolean
}) {
  const links = [
    { href: '#elections-catalog', label: 'Elections' },
    { href: '#features', label: 'Features' },
    { href: '#how', label: 'How it works' },
    { href: '#testimonials', label: 'Reviews' },
  ]

  return (
    <div
      className="nav-links"
      style={
        mobileOpen
          ? {
              display: 'flex',
              position: 'absolute',
              top: 68,
              left: 0,
              right: 0,
              flexDirection: 'column',
              gap: 16,
              padding: '20px 24px',
              background: 'rgba(9,21,45,0.98)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }
          : undefined
      }
    >
      {links.map((l) => (
        <a key={l.href} className="nav-link" href={l.href} onClick={() => setMobileOpen(false)}>
          {l.label}
        </a>
      ))}
      {showLangInMobile && mobileOpen ? (
        <div className="nav-lang-mobile">
          <LanguageSwitcher variant="nav" />
        </div>
      ) : null}
    </div>
  )
}

function DashboardPreview({ barsReady }: { barsReady: boolean }) {
  const chartBars = [
    { h: '30%', bg: '#E0E7FF', delay: '0.2s' },
    { h: '55%', bg: '#C7D2FE', delay: '0.3s' },
    { h: '40%', bg: '#A5B4FC', delay: '0.4s' },
    { h: '75%', bg: '#818CF8', delay: '0.5s' },
    { h: '60%', bg: '#6366F1', delay: '0.6s' },
    { h: '90%', bg: '#4F46E5', delay: '0.7s' },
    { h: '80%', bg: '#4338CA', delay: '0.8s' },
  ]

  return (
    <div className="dashboard-preview">
      <div className="dp-topbar">
        <div className="dp-dots">
          <div className="dp-dot" style={{ background: '#EF4444' }} />
          <div className="dp-dot" style={{ background: '#F59E0B' }} />
          <div className="dp-dot" style={{ background: '#10B981' }} />
        </div>
        <span className="dp-title">FortressVote Dashboard</span>
        <div className="dp-live">
          <div className="dp-live-dot" />
          Live
        </div>
      </div>
      <div className="dp-body">
        <div className="dp-stat-row">
          <div className="dp-stat">
            <div className="dp-stat-num">12</div>
            <div className="dp-stat-label">Active</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-num">84K</div>
            <div className="dp-stat-label">Voters</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-num">99.9%</div>
            <div className="dp-stat-label">Uptime</div>
          </div>
        </div>
        <div className="dp-election" style={{ borderLeftColor: '#10B981' }}>
          <div className="dp-el-top">
            <span className="dp-el-title">Student Union Election</span>
            <span className="dp-badge active">Active</span>
          </div>
          <div className="dp-bar-wrap">
            <div
              className="dp-bar-fill"
              style={{
                ['--w' as string]: '62%',
                width: barsReady ? '62%' : 0,
                background: 'linear-gradient(90deg,#10B981,#059669)',
              }}
            />
          </div>
          <div className="dp-bar-meta">
            <span>28,140 voted</span>
            <span>62%</span>
          </div>
        </div>
        <div className="dp-election" style={{ borderLeftColor: '#2563EB' }}>
          <div className="dp-el-top">
            <span className="dp-el-title">Council By-Election</span>
            <span className="dp-badge upcoming">Upcoming</span>
          </div>
          <div className="dp-bar-wrap">
            <div
              className="dp-bar-fill"
              style={{
                ['--w' as string]: '46%',
                width: barsReady ? '46%' : 0,
                background: 'linear-gradient(90deg,#2563EB,#1D4ED8)',
                transitionDelay: '0.3s',
              }}
            />
          </div>
          <div className="dp-bar-meta">
            <span>5,920 registered</span>
            <span>Opens soon</span>
          </div>
        </div>
        <div className="dp-chart-row">
          {chartBars.map((b) => (
            <div
              key={b.delay}
              className="dp-chart-bar"
              style={{ height: b.h, background: b.bg, ['--delay' as string]: b.delay }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
