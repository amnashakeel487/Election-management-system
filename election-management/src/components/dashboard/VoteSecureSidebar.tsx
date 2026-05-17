import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { userInitials } from '@/utils/dashboardDisplay'

export type DashboardRole = 'admin' | 'voter' | 'creator'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
  badge?: string
  badgeVariant?: 'default' | 'info' | 'warn' | 'live' | 'cyan'
}

interface VoteSecureSidebarProps {
  role: DashboardRole
  pendingCount?: number
  electionCount?: number
  liveVoteCount?: number
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function badgeClass(v?: NavItem['badgeVariant']) {
  if (v === 'info') return 'vs-nav-badge vs-nav-badge--info'
  if (v === 'warn') return 'vs-nav-badge vs-nav-badge--warn'
  if (v === 'live') return 'vs-nav-badge vs-nav-badge--live'
  if (v === 'cyan') return 'vs-nav-badge vs-nav-badge--cyan'
  return 'vs-nav-badge'
}

function adminNav(pending: number, elections: number): NavItem[] {
  return [
    {
      to: '/admin/dashboard',
      end: true,
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      to: '/admin/approvals',
      label: 'Creator Requests',
      badge: pending > 0 ? String(pending) : undefined,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: '/admin/elections',
      label: 'Elections',
      badge: elections > 0 ? String(elections) : undefined,
      badgeVariant: 'info',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      to: '/admin/users',
      label: 'Users',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/admin/audit-logs',
      label: 'Transparency',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
  ]
}

function voterNav(registrations: number, live: number): NavItem[] {
  return [
    {
      to: '/voter/dashboard',
      end: true,
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: '/browse-elections',
      label: 'Browse Elections',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      to: '/voter/elections',
      label: 'My Elections',
      badge: registrations > 0 ? String(registrations) : undefined,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    ...(live > 0
      ? [
          {
            to: '/voter/vote',
            label: 'Vote Now',
            badge: `${live} Live`,
            badgeVariant: 'live' as const,
            icon: (
              <svg viewBox="0 0 24 24" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ),
          },
        ]
      : []),
  ]
}

function creatorNav(elections: number): NavItem[] {
  return [
    {
      to: '/creator/dashboard',
      end: true,
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      to: '/creator/elections/new',
      label: 'Create Election',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      to: '/creator/dashboard',
      label: 'My Elections',
      badge: elections > 0 ? String(elections) : undefined,
      badgeVariant: 'cyan',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      to: '/creator/candidates',
      label: 'Candidates',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]
}

export function VoteSecureSidebar({
  role,
  pendingCount = 0,
  electionCount = 0,
  liveVoteCount = 0,
}: VoteSecureSidebarProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = userInitials(profile?.full_name, profile?.email)
  const roleLabel =
    role === 'admin' ? 'Administrator Access' : role === 'voter' ? 'Verified Voter' : 'Election Creator'
  const roleClass =
    role === 'admin' ? 'vs-sb-role--admin' : role === 'voter' ? 'vs-sb-role--voter' : 'vs-sb-role--creator'

  const avatarStyle =
    role === 'voter'
      ? { background: 'linear-gradient(135deg,#059669,#10B981)' }
      : role === 'creator'
        ? { background: 'linear-gradient(135deg,#0369a1,#06B6D4)' }
        : { background: 'linear-gradient(135deg,#1B3A6B,#6C3FC5)' }

  const mainNav =
    role === 'admin'
      ? adminNav(pendingCount, electionCount)
      : role === 'voter'
        ? voterNav(electionCount, liveVoteCount)
        : creatorNav(electionCount)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="vs-sidebar">
      <div className="vs-sb-brand">
        <div className="vs-sb-icon">
          <ShieldIcon />
        </div>
        <div>
          <div className="vs-sb-name">VoteSecure</div>
          <span className="vs-sb-tag">Enterprise</span>
        </div>
      </div>

      <div className={`vs-sb-role ${roleClass}`}>
        <div className="vs-sb-role-dot" />
        <div className="vs-sb-role-text">{roleLabel}</div>
      </div>

      <nav className="vs-sb-nav">
        <div className="vs-sb-section">Main</div>
        {mainNav.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `vs-nav-item${isActive ? ' vs-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? <span className={badgeClass(item.badgeVariant)}>{item.badge}</span> : null}
          </NavLink>
        ))}

        {role === 'admin' ? (
          <>
            <div className="vs-sb-section">Account</div>
            <NavLink to="/" className={({ isActive }) => `vs-nav-item${isActive ? ' vs-active' : ''}`}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Public site</span>
            </NavLink>
          </>
        ) : null}

        <div className="vs-sb-section" style={{ marginTop: 8 }}>
          Account
        </div>
        <button type="button" className="vs-nav-item" onClick={() => void handleLogout()}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      <div className="vs-sb-footer">
        <div className="vs-sb-user">
          <div className="vs-sb-avatar" style={avatarStyle}>
            {initials}
          </div>
          <div className="vs-sb-user-info">
            <div className="vs-sb-user-name">{profile?.full_name?.trim() || 'User'}</div>
            <div className="vs-sb-user-role">{profile?.email ?? ''}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
