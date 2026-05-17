import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ADMIN_NAV } from '@/config/adminNav'
import { useAuth } from '@/hooks/useAuth'
import { useAdminApproval } from '@/hooks/useAdminApproval'
import { AdminNavIcon, ShieldBrandIcon } from '@/components/admin/layout/AdminIcons'

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const { t } = useTranslation(['admin', 'common', 'dashboard', 'nav'])
  const [collapsed, setCollapsed] = useState(false)
  const { profile, signOut } = useAuth()
  const { pendingCount } = useAdminApproval(profile?.id)
  const navigate = useNavigate()

  const notificationCount = pendingCount > 0 ? pendingCount : 0

  let lastSection: string | undefined

  return (
    <>
      <aside
        className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
        id="admin-sidebar"
      >
        <div className="sb-brand">
          <div className="sb-icon">
            <ShieldBrandIcon />
          </div>
          <span className="sb-name">{t('admin:brand')}</span>
          <span className="sb-tag">{t('admin:tag')}</span>
        </div>

        <div className="sb-role-badge">
          <div className="sb-role-dot" />
          <div className="sb-role-text">
            <span className="sb-role-sub">{t('dashboard:signedInAs')}</span>
            <span className="sb-role-val">
              {profile ? t(`common:roles.${profile.role}`) : t('admin:tag')}
            </span>
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
              {showSection ? (
                <div className="sb-section-label">
                  {t(`admin:sections.${section}` as 'admin:sections.Main')}
                </div>
              ) : null}
              <NavLink
                to={item.path}
                end={item.id === 'dashboard'}
                className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
                onClick={() => onMobileClose?.()}
              >
                <AdminNavIcon icon={item.icon} />
                <span className="sb-label">{t(`admin:nav.${item.id}` as 'admin:nav.dashboard')}</span>
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
          <span className="sb-label">{t('nav:logout')}</span>
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
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => onMobileClose?.()}
        />
      ) : null}
    </>
  )
}
