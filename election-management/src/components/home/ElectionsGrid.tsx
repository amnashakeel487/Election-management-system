import { useEffect, useState } from 'react'
import { fetchPublishedElections } from '@/services/electionService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { formatTimeRemaining } from '@/utils/electionTime'
import { ElectionCard } from './ElectionCard'

interface ElectionCardData {
  id: string
  variant: 'active' | 'upcoming'
  title: string
  description: string
  timeRemaining?: string
  startsIn?: string
  participationRate?: number
  votesLabel?: string
}

export function ElectionsGrid() {
  const [elections, setElections] = useState<ElectionCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const published = await fetchPublishedElections()
        const cards: ElectionCardData[] = []

        for (const election of published) {
          const now = Date.now()
          const start = new Date(election.start_date).getTime()
          const variant: 'active' | 'upcoming' = now < start ? 'upcoming' : 'active'

          let participationRate: number | undefined
          let votesLabel: string | undefined

          if (variant === 'active') {
            try {
              const stats = await fetchElectionRegistrationStats(election.id)
              participationRate = stats.participation_percent
              votesLabel = `${stats.registered_count.toLocaleString()} Registered`
            } catch {
              participationRate = 0
              votesLabel = '0 Registered'
            }
          }

          const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24))

          cards.push({
            id: election.id,
            variant,
            title: election.title,
            description: election.description ?? 'No description provided.',
            timeRemaining: variant === 'active' ? formatTimeRemaining(election.end_date) : undefined,
            startsIn: variant === 'upcoming' ? `Starts in ${Math.max(0, daysUntilStart)} Days` : undefined,
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

    void load()
    return () => {
      cancelled = true
    }
  }, [])

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
      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading elections…</p>
      ) : elections.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          No published elections yet. Check back soon.
        </p>
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
