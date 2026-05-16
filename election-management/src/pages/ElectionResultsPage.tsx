import { Link, useParams } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { ResultsCandidateTable } from '@/components/results/ResultsCandidateTable'
import { ResultsVoteBarChart } from '@/components/results/ResultsVoteBarChart'
import { ResultsVotePieChart } from '@/components/results/ResultsVotePieChart'
import { WinnerCard } from '@/components/results/WinnerCard'
import { useElectionResults } from '@/hooks/useElectionResults'
import { detectWinner } from '@/utils/detectWinner'
import { formatElectionCode } from '@/utils/electionTime'
import { isPollingEnded } from '@/utils/electionPolling'

export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>()
  const { results, loading, error, lastUpdated, isLive } = useElectionResults(id)

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

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <TopNavBar />
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-margin pt-16 text-center">
          <p className="font-body-md text-error">{error ?? 'Results unavailable'}</p>
          <Link to="/results" className="text-primary hover:underline">
            Browse elections
          </Link>
        </main>
      </div>
    )
  }

  const outcome = detectWinner(results.candidates, results.total_votes)
  const electionEnded = isPollingEnded({ end_date: results.end_date })
  const leaderIds = new Set<string>(
    outcome.type === 'winner'
      ? [outcome.candidate.candidate_id]
      : outcome.type === 'tie'
        ? outcome.candidates.map((c) => c.candidate_id)
        : [],
  )

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <TopNavBar />
      <main className="mx-auto max-w-7xl px-margin pb-16 pt-24">
        <header className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 font-label-sm text-label-sm text-tertiary">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              LIVE RESULTS · {formatElectionCode(results.election_id)}
            </span>
            <h1 className="mb-2 font-headline-xl text-headline-xl text-on-surface">{results.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Real-time tallies from verified anonymous ballots
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {isLive ? (
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-label-md text-label-md text-primary">Live updating</span>
              </div>
            ) : (
              <span className="rounded-full border border-line bg-surface-container-high px-4 py-2 font-label-md text-label-md text-on-surface-variant">
                {electionEnded ? 'Final results' : 'Results available'}
              </span>
            )}
            {lastUpdated ? (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-gutter sm:grid-cols-3">
          <div className="glass-panel rounded-[24px] p-6">
            <p className="font-label-md text-label-md text-on-surface-variant">Total Votes</p>
            <p className="mt-1 font-headline-lg text-headline-lg text-primary">
              {results.total_votes.toLocaleString()}
            </p>
          </div>
          <div className="glass-panel rounded-[24px] p-6">
            <p className="font-label-md text-label-md text-on-surface-variant">Candidates</p>
            <p className="mt-1 font-headline-lg text-headline-lg text-on-surface">
              {results.candidates.length}
            </p>
          </div>
          <div className="glass-panel rounded-[24px] p-6">
            <p className="font-label-md text-label-md text-on-surface-variant">Status</p>
            <p className="mt-1 font-headline-lg text-headline-lg capitalize text-tertiary">{results.status}</p>
          </div>
        </div>

        <div className="mb-8">
          <WinnerCard outcome={outcome} totalVotes={results.total_votes} electionEnded={electionEnded} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-gutter lg:grid-cols-2">
          <ResultsVoteBarChart candidates={results.candidates} totalVotes={results.total_votes} />
          <ResultsVotePieChart candidates={results.candidates} totalVotes={results.total_votes} />
        </div>

        <ResultsCandidateTable
          candidates={results.candidates}
          totalVotes={results.total_votes}
          leaderIds={leaderIds}
        />

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to={`/elections/${results.election_id}`}
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
