import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import '@/styles/voter-dashboard.css'
import { VoterSidebar } from '@/components/voter/layout/VoterSidebar'
import { VoterDashboardProvider } from '@/context/VoterDashboardContext'
import { useAuth } from '@/hooks/useAuth'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { userInitials } from '@/utils/dashboardDisplay'

function voterTopMeta(pathname: string): { title: string; sub?: string } {
  if (pathname === '/voter/dashboard') return { title: 'Voter Home' }
  if (pathname === '/voter/elections') return { title: 'My Elections' }
  if (pathname.startsWith('/voter/elections/')) return { title: 'Election Details' }
  if (pathname === '/voter/polls') return { title: 'Joined Polls' }
  if (pathname === '/voter/vote') return { title: 'Vote Hub' }
  if (pathname.startsWith('/voter/vote/') && pathname !== '/voter/vote/success') return { title: 'Cast Vote' }
  if (pathname === '/voter/vote/success') return { title: 'Vote Submitted' }
  if (pathname === '/voter/results') return { title: 'Election Results' }
  if (pathname.startsWith('/voter/results/')) return { title: 'Live Results' }
  if (pathname === '/voter/notifications') return { title: 'Notifications' }
  if (pathname === '/voter/profile') return { title: 'My Profile' }
  if (pathname === '/voter/settings') return { title: 'Settings' }
  return { title: 'Voter' }
}

function VoterLayoutInner() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { notificationCount } = useVoterDashboard()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('dashboard-sidebar-open', mobileOpen)
    return () => document.body.classList.remove('dashboard-sidebar-open')
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const meta = useMemo(() => voterTopMeta(pathname), [pathname])

  const welcomeDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const displayName = profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'Voter'
  const subtitle = `Welcome back, ${displayName} · ${welcomeDate}`

  return (
    <div className="voter-app">
      <div className="app">
        <VoterSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="main">
          <div className="topbar">
            <button
              type="button"
              className="icon-btn voter-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden style={{ width: 15, height: 15 }}>
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <div className="topbar-left">
              <div className="topbar-title">{meta.title}</div>
              <div className="topbar-sub">{meta.sub ?? subtitle}</div>
            </div>
            <div className="topbar-right">
              <div className="tb-search">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="search" placeholder="Search elections…" aria-label="Search elections" />
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
                onClick={() => navigate('/voter/notifications')}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 ? <span className="notif-dot" /> : null}
              </button>
              <button type="button" className="btn btn-success btn-sm" onClick={() => navigate('/voter/vote')}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Vote Now
              </button>
              <button
                type="button"
                className="avatar"
                aria-label="Profile"
                onClick={() => navigate('/voter/profile')}
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

export function VoterLayout() {
  return (
    <VoterDashboardProvider>
      <VoterLayoutInner />
    </VoterDashboardProvider>
  )
}
