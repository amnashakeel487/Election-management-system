import { Link } from 'react-router-dom'
import type { VoterNotificationItem, VoterNotificationKind } from '@/utils/voterNotifications'

function iconStyles(kind: VoterNotificationKind): { bg: string; color: string } {
  switch (kind) {
    case 'vote_pending':
      return { bg: '#FEE2E2', color: '#EF4444' }
    case 'registered':
    case 'secret_id':
    case 'voted':
    case 'promoted':
      return { bg: '#DCFCE7', color: '#16A34A' }
    case 'waitlist':
      return { bg: '#FEF9C3', color: '#CA8A04' }
    case 'results':
    case 'election_end':
      return { bg: '#EFF4FF', color: '#2451A3' }
    case 'election_start':
      return { bg: '#ECFEFF', color: '#0891B2' }
    default:
      return { bg: '#EFF4FF', color: '#2451A3' }
  }
}

function NotificationIcon({ kind }: { kind: VoterNotificationKind }) {
  if (kind === 'vote_pending' || kind === 'election_start') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
  if (kind === 'secret_id') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5" />
      </svg>
    )
  }
  if (kind === 'voted' || kind === 'registered') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }
  if (kind === 'promoted') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    )
  }
  if (kind === 'waitlist') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export interface VoterNotificationListProps {
  items: VoterNotificationItem[]
  emptyMessage?: string
}

export function VoterNotificationList({
  items,
  emptyMessage = "You're all caught up.",
}: VoterNotificationListProps) {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--subtle)', padding: '12px 0' }}>{emptyMessage}</p>
    )
  }

  return (
    <>
      {items.map((n) => {
        const { bg, color } = iconStyles(n.kind)
        const inner = (
          <>
            {n.unread !== false ? <div className="notif-unread" /> : <div style={{ width: 7, flexShrink: 0 }} />}
            <div className="notif-icon" style={{ background: bg, color }}>
              <NotificationIcon kind={n.kind} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-sub">{n.sub}</div>
            </div>
            <span className="notif-time">{n.timeLabel}</span>
          </>
        )

        return n.href ? (
          <Link
            key={n.id}
            to={n.href}
            className="notif-item voter-notif-item--link"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {inner}
          </Link>
        ) : (
          <div key={n.id} className="notif-item">
            {inner}
          </div>
        )
      })}
    </>
  )
}
