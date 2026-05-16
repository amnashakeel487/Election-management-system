import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import '@/styles/admin-dashboard.css'
import '@/styles/admin-dashboard-dark.css'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { useAuth } from '@/hooks/useAuth'
import { userInitials } from '@/utils/dashboardDisplay'

function resolvePageKey(pathname: string): string {
  if (pathname.includes('/admin/elections/') && pathname !== '/admin/elections') return 'election-detail'
  if (pathname.startsWith('/admin/requests') || pathname.startsWith('/admin/approvals')) return 'requests'
  if (pathname.startsWith('/admin/audit')) return 'audit'
  return pathname.replace('/admin/', '') || 'dashboard'
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const pageKey = resolvePageKey(pathname)
  const meta = ADMIN_PAGE_META[pageKey] ?? ADMIN_PAGE_META.dashboard

  const welcomeDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="admin-app">
      <div className="app">
        <AdminSidebar />
        <main className="main">
          <div className="topbar">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="topbar-title">{meta.topTitle}</div>
              <div className="topbar-subtitle">
                {meta.topSub ?? `Welcome back${profile?.full_name ? `, ${profile.full_name}` : ''} · ${welcomeDate}`}
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-search">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="11" cy="11" r="8" fill="none" strokeWidth="2" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                </svg>
                <input type="search" placeholder="Search anything…" aria-label="Search admin" />
              </div>
              <ThemeToggle variant="icon-btn" />
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
                onClick={() => navigate('/admin/notifications')}
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
                <span className="notif-dot" />
              </button>
              <button
                type="button"
                className="avatar"
                aria-label="Profile"
                onClick={() => navigate('/admin/profile')}
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
