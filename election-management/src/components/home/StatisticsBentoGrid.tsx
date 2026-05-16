import { useEffect, useState } from 'react'
import { fetchPlatformStats } from '@/services/platformStatsService'

/** Compact platform stats for the landing page (responsive strip). */
export function StatisticsBentoGrid() {
  const [stats, setStats] = useState([
    { icon: 'how_to_vote', color: 'text-tertiary', value: '—', label: 'Votes cast (platform)' },
    { icon: 'event_available', color: 'text-primary', value: '—', label: 'Active elections' },
    { icon: 'verified', color: 'text-secondary', value: '—', label: 'Registered voters' },
  ])

  useEffect(() => {
    void fetchPlatformStats()
      .then((s) => {
        setStats([
          {
            icon: 'how_to_vote',
            color: 'text-tertiary',
            value: s.total_votes.toLocaleString(),
            label: 'Votes cast (platform)',
          },
          {
            icon: 'event_available',
            color: 'text-primary',
            value: String(s.active_elections),
            label: 'Active elections',
          },
          {
            icon: 'verified',
            color: 'text-secondary',
            value: s.verified_voters.toLocaleString(),
            label: 'Registered voters',
          },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-2xl border border-line bg-surface-container-low/90 px-4 py-4 sm:flex-col sm:items-start sm:px-5 sm:py-5"
        >
          <span className={`material-symbols-outlined shrink-0 text-3xl sm:mb-1 sm:text-4xl ${stat.color}`}>{stat.icon}</span>
          <div className="min-w-0 flex-1 sm:w-full">
            <p className="font-headline-md text-headline-md tabular-nums text-on-surface sm:font-headline-lg sm:text-headline-lg">
              {stat.value}
            </p>
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant sm:font-label-md sm:text-label-md">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
