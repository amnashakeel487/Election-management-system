import { useEffect, useState } from 'react'
import { fetchPublicElections, type PublicElectionFilter } from '@/services/electionService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { formatTimeRemaining } from '@/utils/electionTime'
import { ElectionCard } from './ElectionCard'

interface ElectionCardData {
  id: string
  variant: 'active' | 'upcoming' | 'completed'
  title: string
  description: string
  timeRemaining?: string
  startsIn?: string
  participationRate?: number
  votesLabel?: string
}

interface ElectionsGridProps {
  query: string
  statusFilter: PublicElectionFilter
}

export function ElectionsGrid({ query, statusFilter }: ElectionsGridProps) {
  const [elections, setElections] = useState<ElectionCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const published = await fetchPublicElections(statusFilter)
        const q = query.trim().toLowerCase()
        const filtered = q
          ? published.filter(
              (e) =>
                e.title.toLowerCase().includes(q) ||
                (e.description ?? '').toLowerCase().includes(q) ||
                (e.category ?? '').toLowerCase().includes(q) ||
                e.id.toLowerCase().includes(q),
            )
          : published

        const cards: ElectionCardData[] = []

        for (const election of filtered) {
          const now = Date.now()
          const start = new Date(election.start_date).getTime()
          const end = new Date(election.end_date).getTime()
          const variant: ElectionCardData['variant'] =
            election.status === 'completed' || now > end
              ? 'completed'
              : now < start
                ? 'upcoming'
                : 'active'

          let participationRate: number | undefined
          let votesLabel: string | undefined

          if (variant === 'active' || variant === 'completed') {
            try {
              const stats = await fetchElectionRegistrationStats(election.id)
              participationRate = stats.participation_percent
              votesLabel = `${stats.registered_count.toLocaleString()} / ${stats.max_voters} registered`
            } catch {
              votesLabel = 'Registration open'
            }
          }

          const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24))

          cards.push({
            id: election.id,
            variant,
            title: election.title,
            description: election.description ?? 'No description provided.',
            timeRemaining:
              variant === 'active' ? formatTimeRemaining(election.end_date) : variant === 'completed' ? 'Ended' : undefined,
            startsIn: variant === 'upcoming' ? `Starts in ${Math.max(0, daysUntilStart)} days` : undefined,
            participationRate,
            votesLabel,
          })
        }

        if (!cancelled) setElections(cards)
      } catch {
        if (!cancelled) setElections([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    void load()
    return () => {
      cancelled = true
    }
  }, [query, statusFilter])

  return (
    <section className="px-margin py-2xl">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Elections</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Upcoming, active, and completed polls on the platform.
          </p>
        </div>
      </div>
      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading elections…</p>
      ) : elections.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">No elections match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => (
            <ElectionCard key={election.id} {...election} detailPath={`/elections/${election.id}`} />
          ))}
        </div>
      )}
    </section>
  )
}
