import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import '@/styles/admin-dashboard.css'
import '@/styles/admin-dashboard-dark.css'
import '@/styles/creator-dashboard-extra.css'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { CreatorElectionProvider } from '@/context/CreatorElectionContext'
import { CreatorSidebar } from '@/components/creator/layout/CreatorSidebar'
import { useAuth } from '@/hooks/useAuth'
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const pageKey = resolvePageKey(pathname)
  const meta = CREATOR_PAGE_META[pageKey] ?? CREATOR_PAGE_META.dashboard

  const welcomeDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="admin-app creator-app">
      <div className="app">
        <CreatorSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="main">
          <div className="topbar">
            <button
              type="button"
              className="icon-btn creator-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div className="topbar-title">{meta.topTitle}</div>
              <div className="topbar-subtitle">
                {meta.topSub ??
                  `Welcome back${profile?.full_name ? `, ${profile.full_name}` : ''} · ${welcomeDate}`}
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-search">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                </svg>
                <input type="search" placeholder="Search elections…" aria-label="Search" />
              </div>
              <LanguageSwitcher variant="admin" />
              <ThemeToggle variant="icon-btn" />
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
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
                aria-label="Profile"
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
