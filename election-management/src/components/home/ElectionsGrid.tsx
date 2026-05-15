import { ElectionCard } from './ElectionCard'

const elections = [
  {
    variant: 'active' as const,
    title: '2024 National Policy Referendum',
    description:
      'Public vote on proposed environmental legislation and infrastructure development funding for the fiscal year.',
    timeRemaining: '14h : 22m : 05s',
    participationRate: 64.2,
    votesLabel: '4.2M Votes',
    hoverAccent: 'primary' as const,
  },
  {
    variant: 'upcoming' as const,
    title: 'Metropolitan Council Elections',
    description: 'Annual selection of representatives for the metropolitan governance and urban planning committee.',
    startsIn: 'Starts in 3 Days',
    eligibleVoters: '1,245,000',
    idRequirements: 'Biometric + 2FA',
    hoverAccent: 'tertiary' as const,
  },
  {
    variant: 'active' as const,
    title: 'Tech Alliance Board Vote',
    description:
      'Quarterly election for the board of directors representing the Regional Technology Alliance members.',
    timeRemaining: '02h : 15m : 45s',
    participationRate: 88.9,
    votesLabel: '8.4k Votes',
    hoverAccent: 'primary' as const,
  },
]

export function ElectionsGrid() {
  return (
    <section className="px-margin py-2xl">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Live &amp; Upcoming</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Real-time participation monitoring from verified nodes.
          </p>
        </div>
        <button type="button" className="font-label-md text-label-md text-primary hover:underline">
          View All Elections
        </button>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => (
          <ElectionCard key={election.title} {...election} />
        ))}
      </div>
    </section>
  )
}
