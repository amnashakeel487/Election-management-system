import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldIcon } from '@/components/auth/AuthSplitChrome'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_LOCALES } from '@/types/locale'
import '@/styles/public-site-nav.css'

export type PublicNavActive = 'elections' | 'browse' | 'results'

export interface PublicSiteNavProps {
  active?: PublicNavActive
  variant?: 'landing' | 'default'
  trailing?: ReactNode
}

function resolveActive(
  pathname: string,
  hash: string,
  explicit?: PublicNavActive,
): PublicNavActive | null {
  if (explicit) return explicit
  if (pathname.startsWith('/browse-elections')) return 'browse'
  if (pathname.startsWith('/results') || pathname.includes('/results')) return 'results'
  if (pathname === '/' && hash === '#elections') return 'elections'
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
  const active = resolveActive(location.pathname, location.hash, activeProp)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.classList.toggle('public-nav-open', mobileOpen)
    return () => document.body.classList.remove('public-nav-open')
  }, [mobileOpen])

  const signedIn = Boolean(session && profile && !mfaRequired)
  const dashboardPath = getDashboardPath() ?? '/'

  const sectionHref = (hash: string) => (onLanding ? hash : `/${hash}`)

  const links = useMemo(
    () => [
      { key: 'elections', href: sectionHref('#elections'), label: tNav('elections'), route: false as const },
      { key: 'results', href: '/results', label: t('nav.liveResults'), route: true as const },
      { key: 'how', href: sectionHref('#how'), label: t('nav.howItWorks'), route: false as const },
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
    mobileOpen ? 'mobile-nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const linkClass = (key: string) => {
    const isActive =
      (key === 'elections' && active === 'elections') ||
      (key === 'results' && active === 'results')
    return `nav-link${isActive ? ' active' : ''}`
  }

  const authButtons = signedIn ? (
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
  )

  const closeMobile = () => setMobileOpen(false)

  const navLinkItems = links.map((l) =>
    l.route ? (
      <Link key={l.key} className={linkClass(l.key)} to={l.href} onClick={closeMobile}>
        {l.label}
      </Link>
    ) : (
      <a key={l.key} className={linkClass(l.key)} href={l.href} onClick={closeMobile}>
        {l.label}
      </a>
    ),
  )

  const mobileDrawer =
    mobileOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="public-nav-backdrop"
              aria-label={t('closeMenu')}
              onClick={closeMobile}
            />
            <div className="public-nav-drawer" role="dialog" aria-modal="true" aria-label={t('openMenu')}>
              <div className="public-nav-drawer-head">
                <span className="public-nav-drawer-title">Menu</span>
                <button
                  type="button"
                  className="public-nav-drawer-close"
                  aria-label={t('closeMenu')}
                  onClick={closeMobile}
                >
                  ×
                </button>
              </div>
              <nav className="public-nav-drawer-links">{navLinkItems}</nav>
              {trailing ? <div className="public-nav-drawer-trailing">{trailing}</div> : null}
              <div className="public-nav-drawer-lang">
                <LanguageSwitcher variant="nav" locales={PUBLIC_LOCALES} />
              </div>
              <div className="public-nav-drawer-actions">{authButtons}</div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <>
      <nav className={navClass}>
        <Link to="/" className="nav-brand" onClick={closeMobile}>
          <div className="nav-icon">
            <ShieldIcon className="h-5 w-5 text-white" />
          </div>
          <span className="nav-name">FortressVote</span>
          <span className="nav-tag">{t('enterprise')}</span>
        </Link>

        <div className="nav-links nav-links--desktop">{navLinkItems}</div>

        <div className="nav-actions nav-actions--desktop">
          <LanguageSwitcher variant="nav" className="nav-lang" locales={PUBLIC_LOCALES} />
          {trailing ? <div className="nav-trailing">{trailing}</div> : null}
          {authButtons}
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
      {mobileDrawer}
    </>
  )
}
