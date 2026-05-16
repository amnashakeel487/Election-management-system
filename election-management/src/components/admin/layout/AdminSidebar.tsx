import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ADMIN_NAV } from '@/config/adminNav'
import { useAuth } from '@/hooks/useAuth'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { AdminNavIcon, ShieldBrandIcon } from '@/components/admin/layout/AdminIcons'
import { ROLE_LABELS } from '@/types/auth'

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, signOut } = useAuth()
  const { pendingCount } = useAdminApproval(profile?.id)
  const navigate = useNavigate()

  const notificationCount = pendingCount > 0 ? pendingCount : 0

  let lastSection: string | undefined

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} id="admin-sidebar">
      <div className="sb-brand">
        <div className="sb-icon">
          <ShieldBrandIcon />
        </div>
        <span className="sb-name">VoteSecure</span>
        <span className="sb-tag">Admin</span>
      </div>

      <div className="sb-role-badge">
        <div className="sb-role-dot" />
        <div className="sb-role-text">
          <span className="sb-role-sub">Signed in as</span>
          <span className="sb-role-val">{profile ? ROLE_LABELS[profile.role] : 'Admin'}</span>
        </div>
      </div>

      {ADMIN_NAV.map((item) => {
        const section = item.section
        const showSection = section && section !== lastSection
        if (section) lastSection = section

        const badge =
          item.badgeKey === 'pending' && pendingCount > 0
            ? pendingCount
            : item.badgeKey === 'notifications' && notificationCount > 0
              ? notificationCount
              : null

        return (
          <div key={item.id}>
            {showSection ? <div className="sb-section-label">{section}</div> : null}
            <NavLink
              to={item.path}
              end={item.id === 'dashboard'}
              className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
            >
              <AdminNavIcon icon={item.icon} />
              <span className="sb-label">{item.label}</span>
              {badge != null ? <span className="sb-badge">{badge}</span> : null}
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
        <AdminNavIcon icon="logout" />
        <span className="sb-label">Logout</span>
      </div>

      <div className="sb-collapse-btn" role="button" tabIndex={0} onClick={() => setCollapsed((c) => !c)}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <polyline
            points="15 18 9 12 15 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </aside>
  )
}
