import { useEffect, useMemo, useState } from 'react'
import { VoterNotificationList } from '@/components/voter/VoterNotificationList'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { relTime } from '@/utils/voterNotifications'

export function VoterNotificationsPage() {
  const { notifications, loading, notificationsLoading, reload } = useVoterDashboard()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const displayItems = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        timeLabel:
          n.timeLabel === 'Now' ? 'Now' : relTime(new Date(n.sortAt).toISOString()) || n.timeLabel,
      })),
    [notifications, tick],
  )

  const busy = loading && notifications.length === 0

  return (
    <>
      <VoterPageHeader
        eyebrow="Alerts"
        title="Notifications"
        subtitle="Election reminders, ID delivery and voting alerts — synced with your registrations"
      />

      <div className="card-elevated voter-notif-card">
        <div
          className="voter-notif-card-head"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 0',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase' }}>
            {notifications.length} alert{notifications.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={notificationsLoading}
            onClick={() => void reload()}
          >
            {notificationsLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="card-body" style={{ padding: '8px 16px 12px' }}>
          {busy ? (
            <div className="voter-notif-skeleton" aria-busy="true" aria-label="Loading notifications">
              {[0, 1, 2].map((i) => (
                <div key={i} className="voter-notif-skeleton-row" />
              ))}
            </div>
          ) : (
            <VoterNotificationList items={displayItems} />
          )}
        </div>
      </div>
    </>
  )
}
