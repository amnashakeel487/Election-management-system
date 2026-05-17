import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { VOTER_SIDEBAR_NAV, type VoterNavItem } from '@/config/voterNav'
import { LockMiniIcon, LogoutIcon, ShieldBrandIcon, VoterNavIcon } from '@/components/voter/layout/VoterIcons'
import { useAuth } from '@/hooks/useAuth'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { userInitials } from '@/utils/dashboardDisplay'

interface VoterSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function isVoterSidebarActive(item: VoterNavItem, pathname: string, linkActive: boolean): boolean {
  if (item.id === 'elections') {
    if (pathname === '/voter/elections') return true
    return pathname.startsWith('/voter/elections/')
  }
  if (item.id === 'vote') {
    if (pathname === '/voter/vote') return true
    return pathname.startsWith('/voter/vote')
  }
  if (item.id === 'results') {
    if (pathname === '/voter/results') return true
    return pathname.startsWith('/voter/results/')
  }
  return linkActive
}

export function VoterSidebar({ mobileOpen = false, onMobileClose }: VoterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { pendingVoteCount, notificationCount, registered } = useVoterDashboard()

  let lastSection: string | undefined

  const primarySecret = registered.find((r) => r.secret_voter_id)?.secret_voter_id
  const maskedPrimary = primarySecret ? maskSecretVoterId(primarySecret) : 'Per election'

  return (
    <>
      <aside
        className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
        aria-label="Voter navigation"
      >
        <div className="sb-brand">
          <div className="sb-icon">
            <ShieldBrandIcon />
          </div>
          <span className="sb-name">VoteSecure</span>
          <span className="sb-tag">Voter</span>
        </div>

        <div className="sb-voter-card">
          <div className="sv-top">
            <div className="sv-avatar">{userInitials(profile?.full_name, profile?.email)}</div>
            <div>
              <div className="sv-name">{profile?.full_name?.trim() || 'Voter'}</div>
              <div className="sv-email">{profile?.email ?? ''}</div>
            </div>
          </div>
          <div className="sv-id">
            <LockMiniIcon />
            <div>
              <div className="sv-id-label">Voter ID</div>
              <div className="sv-id-val">{maskedPrimary}</div>
            </div>
          </div>
        </div>

        {VOTER_SIDEBAR_NAV.filter((i) => i.sidebar !== false).map((item) => {
          const section = item.section
          const showSection = section && section !== lastSection
          if (section) lastSection = section

          const badge =
            item.id === 'vote' && pendingVoteCount > 0 ? (
              <span className="sb-badge">{pendingVoteCount > 99 ? '99+' : pendingVoteCount}</span>
            ) : item.id === 'notifications' && notificationCount > 0 ? (
              <span className="sb-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
            ) : null

          return (
            <div key={item.id}>
              {showSection ? (
                <div className="sb-section-label">
                  {section === 'main' ? 'Main' : section === 'data' ? 'Data' : 'Account'}
                </div>
              ) : null}
              <NavLink
                to={item.path}
                end={item.end ?? false}
                className={({ isActive }) =>
                  `sb-item${isVoterSidebarActive(item, pathname, isActive) ? ' active' : ''}`
                }
                onClick={() => onMobileClose?.()}
              >
                <VoterNavIcon icon={item.icon} />
                <span className="sb-label">{item.label}</span>
                {badge}
              </NavLink>
            </div>
          )
        })}

        <div
          className="sb-item"
          style={{ color: 'rgba(239,68,68,0.7)' }}
          role="button"
          tabIndex={0}
          onClick={() => void signOut().then(() => navigate('/login'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void signOut().then(() => navigate('/login'))
          }}
        >
          <LogoutIcon />
          <span className="sb-label">Logout</span>
        </div>

        <div
          className="sb-collapse-btn"
          role="button"
          tabIndex={0}
          onClick={() => setCollapsed((c) => !c)}
          onKeyDown={(e) => e.key === 'Enter' && setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
      </aside>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(0,0,0,0.4)',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => onMobileClose?.()}
        />
      ) : null}
    </>
  )
}
