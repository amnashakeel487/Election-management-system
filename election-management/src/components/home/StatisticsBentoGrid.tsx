const stats = [
  { icon: 'how_to_vote', color: 'text-tertiary', value: '12.4M+', label: 'Total Votes Cast' },
  { icon: 'event_available', color: 'text-primary', value: '342', label: 'Active Elections' },
  { icon: 'verified', color: 'text-secondary', value: '8.9M+', label: 'Verified Voters' },
] as const

export function StatisticsBentoGrid() {
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
            <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
