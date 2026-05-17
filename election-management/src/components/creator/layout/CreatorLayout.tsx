import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '@/styles/admin-dashboard.css'
import '@/styles/admin-dashboard-dark.css'
import '@/styles/creator-dashboard-extra.css'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { CreatorElectionProvider } from '@/context/CreatorElectionContext'
import { CreatorSidebar } from '@/components/creator/layout/CreatorSidebar'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { CREATOR_LOCALES } from '@/types/locale'
import { userInitials } from '@/utils/dashboardDisplay'

function resolvePageKey(pathname: string): string {
  if (pathname.includes('/creator/elections/') && pathname !== '/creator/elections' && !pathname.endsWith('/new')) {
    if (pathname.endsWith('/edit')) return 'create'
    return 'election-detail'
  }
  if (pathname.startsWith('/creator/elections')) return pathname.endsWith('/new') ? 'create' : 'elections'
  const segment = pathname.replace('/creator/', '').split('/')[0]
  return segment || 'dashboard'
}

function CreatorLayoutInner() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t, i18n } = useTranslation('creator')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pageKey = resolvePageKey(pathname)

  useEffect(() => {
    document.body.classList.toggle('dashboard-sidebar-open', mobileOpen)
    return () => document.body.classList.remove('dashboard-sidebar-open')
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])
  const meta = useCreatorPageMeta(pageKey)

  const dateLocale = i18n.language === 'ur' ? 'ur-PK' : undefined
  const welcomeDate = new Date().toLocaleDateString(dateLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const welcomeSubtitle = meta.topSub
    ? meta.topSub
    : profile?.full_name
      ? t('topbar.welcomeBackNamed', { name: profile.full_name })
      : `${t('topbar.welcomeBack')} · ${welcomeDate}`

  return (
    <div className="admin-app creator-app">
      <div className="app">
        <CreatorSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="main">
          <div className="topbar">
            <button
              type="button"
              className="icon-btn creator-mobile-menu-btn"
              aria-label={t('topbar.openMenu')}
              onClick={() => setMobileOpen(true)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div className="topbar-title">{meta.topTitle}</div>
              <div className="topbar-subtitle">{welcomeSubtitle}</div>
            </div>
            <div className="topbar-right">
              <div className="topbar-search">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                </svg>
                <input
                  type="search"
                  placeholder={t('topbar.searchPlaceholder')}
                  aria-label={t('topbar.searchPlaceholder')}
                />
              </div>
              <LanguageSwitcher variant="admin" locales={CREATOR_LOCALES} />
              <ThemeToggle variant="icon-btn" />
              <button
                type="button"
                className="icon-btn"
                aria-label={t('topbar.notifications')}
                onClick={() => navigate('/creator/notifications')}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" strokeWidth="2" />
                </svg>
              </button>
              <button
                type="button"
                className="avatar"
                aria-label={t('topbar.profile')}
                onClick={() => navigate('/creator/profile')}
              >
                {userInitials(profile?.full_name, profile?.email)}
              </button>
            </div>
          </div>
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export function CreatorLayout() {
  return (
    <CreatorElectionProvider>
      <CreatorLayoutInner />
    </CreatorElectionProvider>
  )
}
