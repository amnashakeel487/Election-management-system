import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { buildVoterNotifications } from '@/utils/voterNotifications'

export function VoterNotificationsPage() {
  const { registrations } = useVoterDashboard()
  const items = buildVoterNotifications(registrations)

  return (
    <>
      <VoterPageHeader
        eyebrow="Alerts"
        title="Notifications"
        subtitle="Election reminders, ID delivery and voting alerts"
      />

      <div className="card-elevated">
        <div className="card-body" style={{ padding: '8px 16px' }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)', padding: '12px 0' }}>You&apos;re all caught up.</p>
          ) : (
            items.map((n) => {
              const iconBg =
                n.kind === 'vote_pending'
                  ? '#FEE2E2'
                  : n.kind === 'secret_id'
                    ? '#DCFCE7'
                    : n.kind === 'voted'
                      ? '#DCFCE7'
                      : n.kind === 'waitlist'
                        ? '#FEF9C3'
                        : '#EFF4FF'
              const iconColor =
                n.kind === 'vote_pending' ? '#EF4444' : n.kind === 'results' ? '#2451A3' : '#16A34A'

              const inner = (
                <>
                  <div className="notif-unread" />
                  <div className="notif-icon" style={{ background: iconBg, color: iconColor }}>
                    {n.kind === 'vote_pending' ? (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : n.kind === 'secret_id' ? (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5" />
                      </svg>
                    ) : n.kind === 'voted' ? (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-sub">{n.sub}</div>
                  </div>
                  <span className="notif-time">{n.timeLabel}</span>
                </>
              )

              return n.href ? (
                <Link key={n.id} to={n.href} className="notif-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className="notif-item">
                  {inner}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
