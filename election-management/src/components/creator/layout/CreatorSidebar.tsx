import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CREATOR_NAV } from '@/config/creatorNav'
import { CreatorNavIcon, ShieldBrandIcon } from '@/components/creator/layout/CreatorIcons'
import { useAuth } from '@/hooks/useAuth'

interface CreatorSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function CreatorSidebar({ mobileOpen = false, onMobileClose }: CreatorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  let lastSection: string | undefined

  return (
    <>
      <aside
        className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
        id="creator-sidebar"
      >
        <div className="sb-brand">
          <div className="sb-icon">
            <ShieldBrandIcon />
          </div>
          <span className="sb-name">VoteSecure</span>
          <span className="sb-tag">Creator</span>
        </div>

        <div className="sb-role-badge">
          <div className="sb-role-dot" />
          <div className="sb-role-text">
            <span className="sb-role-sub">Signed in as</span>
            <span className="sb-role-val">Election Creator</span>
          </div>
        </div>

        {CREATOR_NAV.map((item) => {
          const section = item.section
          const showSection = section && section !== lastSection
          if (section) lastSection = section

          return (
            <div key={item.id}>
              {showSection ? <div className="sb-section-label">{section}</div> : null}
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
                onClick={() => onMobileClose?.()}
              >
                <CreatorNavIcon icon={item.icon} />
                <span className="sb-label">{item.label}</span>
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
          <CreatorNavIcon icon="logout" />
          <span className="sb-label">Logout</span>
        </div>

        <div
          className="sb-collapse-btn"
          role="button"
          tabIndex={0}
          onClick={() => setCollapsed((c) => !c)}
          onKeyDown={(e) => e.key === 'Enter' && setCollapsed((c) => !c)}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth="2" />
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
