import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { ResultsCandidateProgressList } from '@/components/results/ResultsCandidateProgressList'
import { ResultsCandidateTable } from '@/components/results/ResultsCandidateTable'
import { ResultsLiveStatusBadge } from '@/components/results/ResultsLiveStatusBadge'
import { ResultsLockPanel } from '@/components/results/ResultsLockPanel'
import { ResultsTurnoutPanel } from '@/components/results/ResultsTurnoutPanel'
import { ResultsVoteBarChart } from '@/components/results/ResultsVoteBarChart'
import { ResultsVotePieChart } from '@/components/results/ResultsVotePieChart'
import { ResultsVoteTrendChart } from '@/components/results/ResultsVoteTrendChart'
import { WinnerCard } from '@/components/results/WinnerCard'
import { useAuth } from '@/hooks/useAuth'
import { useElectionResults } from '@/hooks/useElectionResults'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { buildResultsSummary } from '@/utils/resultsDisplay'
import { formatElectionCode } from '@/utils/electionTime'

export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { results, loading, error, lastUpdated, isLive, refresh } = useElectionResults(id)
  const [lockedResults, setLockedResults] = useState<ElectionResultsPayload | null>(null)

  const display = lockedResults ?? results
  const isCreator = Boolean(profile?.id && display?.creator_id === profile.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <TopNavBar />
        <main className="flex min-h-screen items-center justify-center pt-16">
          <p className="font-body-md text-on-surface-variant">Loading live results…</p>
        </main>
      </div>
    )
  }

  if (error || !display) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <TopNavBar />
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-margin pt-16 text-center">
          <p className="font-body-md text-error">{error ?? 'Results unavailable'}</p>
          <p className="font-body-sm text-on-surface-variant">
            Live results appear when enabled by the organizer, or after voting closes.
          </p>
          <Link to="/results" className="text-primary hover:underline">
            Browse elections
          </Link>
        </main>
      </div>
    )
  }

  const { outcome, leaderIds } = buildResultsSummary(display)
  const electionEnded = display.polling_ended

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <TopNavBar />
      <main className="mx-auto max-w-7xl px-margin pb-16 pt-24">
        <header className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 font-label-sm text-label-sm text-tertiary">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              LIVE RESULTS · {formatElectionCode(display.election_id)}
            </span>
            <h1 className="mb-2 font-headline-xl text-headline-xl text-on-surface">{display.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {isLive
                ? 'Votes are counted in real time as anonymous ballots are cast.'
                : 'Certified tallies from verified anonymous ballots.'}
            </p>
          </div>
          <ResultsLiveStatusBadge results={display} lastUpdated={lastUpdated} />
        </header>

        <ResultsLockPanel
          results={display}
          isCreator={isCreator}
          onLocked={(updated) => {
            setLockedResults(updated)
            void refresh()
          }}
        />

        <div className="mb-8 grid grid-cols-1 gap-gutter lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ResultsTurnoutPanel results={display} />
          </div>
          <div className="glass-panel flex flex-col justify-center rounded-[24px] p-6">
            <p className="font-label-md text-label-md text-on-surface-variant">Total votes counted</p>
            <p className="mt-1 font-headline-xl text-headline-xl text-primary">
              {display.total_votes.toLocaleString()}
            </p>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              {display.candidates.length} candidate{display.candidates.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <WinnerCard
            outcome={outcome}
            totalVotes={display.total_votes}
            electionEnded={electionEnded}
            resultsLocked={Boolean(display.results_locked_at)}
          />
        </div>

        <div className="mb-8">
          <ResultsCandidateProgressList
            candidates={display.candidates}
            totalVotes={display.total_votes}
            leaderIds={leaderIds}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <ResultsVoteBarChart candidates={display.candidates} totalVotes={display.total_votes} />
          <ResultsVotePieChart candidates={display.candidates} totalVotes={display.total_votes} />
        </div>

        <div className="mb-8">
          <ResultsVoteTrendChart voteTrend={display.vote_trend} />
        </div>

        <ResultsCandidateTable
          candidates={display.candidates}
          totalVotes={display.total_votes}
          leaderIds={leaderIds}
        />

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to={`/elections/${display.election_id}`}
            className="rounded-xl border border-line px-lg py-md font-body-md hover:bg-surface-container"
          >
            Election details
          </Link>
          <Link to="/results" className="rounded-xl border border-line px-lg py-md font-body-md hover:bg-surface-container">
            All results
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
