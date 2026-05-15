import { useEffect, useState } from 'react'
import { fetchPlatformStats } from '@/services/platformStatsService'

export function StatisticsBentoGrid() {
  const [stats, setStats] = useState([
    { icon: 'how_to_vote', color: 'text-tertiary', value: '—', label: 'Total Votes Cast' },
    { icon: 'event_available', color: 'text-primary', value: '—', label: 'Active Elections' },
    { icon: 'verified', color: 'text-secondary', value: '—', label: 'Registered Voters' },
  ])

  useEffect(() => {
    void fetchPlatformStats()
      .then((s) => {
        setStats([
          { icon: 'how_to_vote', color: 'text-tertiary', value: `${s.total_votes.toLocaleString()}`, label: 'Total Votes Cast' },
          { icon: 'event_available', color: 'text-primary', value: `${s.active_elections}`, label: 'Active Elections' },
          { icon: 'verified', color: 'text-secondary', value: `${s.verified_voters.toLocaleString()}`, label: 'Registered Voters' },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <section className="px-margin py-2xl">
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card flex flex-col items-center rounded-[24px] border border-white/5 p-xl text-center"
          >
            <span className={`material-symbols-outlined mb-4 text-4xl ${stat.color}`}>{stat.icon}</span>
            <h3 className="mb-2 font-headline-xl text-headline-xl text-on-surface">{stat.value}</h3>
            <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
