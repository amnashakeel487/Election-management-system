import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldIcon } from '@/components/auth/AuthSplitChrome'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_LOCALES } from '@/types/locale'
import '@/styles/public-site-nav.css'

export type PublicNavActive = 'home' | 'elections' | 'results'

export interface PublicSiteNavProps {
  /** Highlight the current section; inferred from the URL when omitted. */
  active?: PublicNavActive
  /** `landing` uses a fixed bar on the home page; other public pages use sticky. */
  variant?: 'landing' | 'default'
  /** Extra controls before auth buttons (e.g. live pill, share, PDF). */
  trailing?: ReactNode
}

function resolveActive(pathname: string, explicit?: PublicNavActive): PublicNavActive | null {
  if (explicit) return explicit
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/browse-elections')) return 'elections'
  if (pathname.startsWith('/results') || pathname.includes('/results')) return 'results'
  return null
}

export function PublicSiteNav({ active: activeProp, variant = 'default', trailing }: PublicSiteNavProps) {
  const { t } = useTranslation('landing')
  const { t: tNav } = useTranslation('nav')
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, getDashboardPath, mfaRequired } = useAuth()
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLanding = location.pathname === '/'
  const active = resolveActive(location.pathname, activeProp)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.hash])

  const signedIn = Boolean(session && profile && !mfaRequired)
  const dashboardPath = getDashboardPath() ?? '/'

  const sectionHref = (hash: string) => (onLanding ? hash : `/${hash}`)

  const links = useMemo(
    () => [
      { key: 'home', href: '/', label: t('nav.home'), route: true as const },
      { key: 'elections', href: '/browse-elections', label: tNav('elections'), route: true as const },
      { key: 'results', href: '/results', label: t('nav.liveResults'), route: true as const },
      { key: 'features', href: sectionHref('#features'), label: t('nav.features'), route: false as const },
      { key: 'how', href: sectionHref('#how'), label: t('nav.howItWorks'), route: false as const },
      { key: 'reviews', href: sectionHref('#testimonials'), label: t('nav.reviews'), route: false as const },
      { key: 'team', href: sectionHref('#team'), label: t('nav.team'), route: false as const },
      { key: 'contact', href: sectionHref('#contact'), label: t('nav.contact'), route: false as const },
    ],
    [onLanding, t, tNav],
  )

  const navClass = [
    'public-nav-root',
    'navbar',
    variant === 'landing' ? 'navbar--landing' : '',
    navScrolled ? 'scrolled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const linkClass = (key: string) => {
    const isActive =
      (key === 'home' && active === 'home') ||
      (key === 'elections' && active === 'elections') ||
      (key === 'results' && active === 'results')
    return `nav-link${isActive ? ' active' : ''}`
  }

  const mobileMenuStyle = mobileOpen
    ? {
        display: 'flex' as const,
        position: 'absolute' as const,
        top: 68,
        left: 0,
        right: 0,
        flexDirection: 'column' as const,
        gap: 16,
        padding: '20px 24px',
        background: 'rgba(9,21,45,0.98)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }
    : undefined

  return (
    <nav className={navClass}>
      <Link to="/" className="nav-brand">
        <div className="nav-icon">
          <ShieldIcon className="h-5 w-5 text-white" />
        </div>
        <span className="nav-name">FortressVote</span>
        <span className="nav-tag">{t('enterprise')}</span>
      </Link>

      <div className="nav-links" style={mobileMenuStyle}>
        {links.map((l) =>
          l.route ? (
            <Link
              key={l.key}
              className={linkClass(l.key)}
              to={l.href}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ) : (
            <a
              key={l.key}
              className={linkClass(l.key)}
              href={l.href}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ),
        )}
        {mobileOpen ? (
          <div className="nav-lang-mobile">
            <LanguageSwitcher variant="nav" locales={PUBLIC_LOCALES} />
          </div>
        ) : null}
      </div>

      <div className="nav-actions">
        <LanguageSwitcher variant="nav" className="nav-lang" locales={PUBLIC_LOCALES} />
        {trailing ? <div className="nav-trailing">{trailing}</div> : null}
        {signedIn ? (
          <button type="button" className="btn-primary-nav" onClick={() => navigate(dashboardPath)}>
            {t('dashboard')}
          </button>
        ) : (
          <>
            <button type="button" className="btn-ghost-nav" onClick={() => navigate('/login')}>
              {t('logIn')}
            </button>
            <button type="button" className="btn-primary-nav" onClick={() => navigate('/register')}>
              {t('getStarted')}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="nav-hamburger"
        aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  )
}
