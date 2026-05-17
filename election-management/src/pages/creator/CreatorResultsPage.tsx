import { Link } from 'react-router-dom'
import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { useElectionResults } from '@/hooks/useElectionResults'
import { buildResultsSummary } from '@/utils/resultsDisplay'

const meta = CREATOR_PAGE_META.results

const BAR_COLORS = ['#2451A3', '#6C3FC5', '#10B981', '#F59E0B', '#06B6D4']

export function CreatorResultsPage() {
  const { selectedId, selectedElection } = useCreatorElection()
  const { results, loading, error, isLive, refresh } = useElectionResults(selectedId ?? undefined)

  const summary = results ? buildResultsSummary(results) : null
  const totalVotes = results?.total_votes ?? 0
  const winnerName =
    summary?.outcome.type === 'winner'
      ? summary.outcome.candidate.name
      : summary?.outcome.type === 'tie'
        ? summary.outcome.candidates.map((c) => c.name).join(' · ')
        : null

  return (
    <>
      <CreatorPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          selectedId ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => void refresh()}>
              Refresh
            </button>
          ) : null
        }
      />
      <CreatorElectionPicker className="mb-4" />

      {!selectedId ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Select an election to view results.</p>
      ) : loading ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading results…</p>
      ) : error || !results ? (
        <div className="card-elevated">
          <div className="card-body">
            <p style={{ color: 'var(--danger)' }}>{error ?? 'Results not available yet.'}</p>
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 8 }}>
              Enable real-time results in election settings or wait until voting ends.
            </p>
          </div>
        </div>
      ) : (
        <>
          {isLive ? (
            <span className="badge b-live" style={{ marginBottom: 14 }}>
              <span className="b-dot" /> Live counting
            </span>
          ) : null}

          {winnerName ? (
            <div className="winner-card" style={{ marginBottom: 18 }}>
              <div className="winner-label">Leading / winner</div>
              <div className="winner-name">{winnerName}</div>
              <div className="winner-votes">{totalVotes.toLocaleString()} total votes cast</div>
            </div>
          ) : null}

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">{selectedElection?.title ?? 'Results'}</div>
              <Link to={`/elections/${selectedId}/results`} className="btn btn-sm btn-ghost" target="_blank" rel="noreferrer">
                Public page
              </Link>
            </div>
            <div className="card-body">
              {results.candidates.map((c, i) => {
                const pct = totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0
                return (
                  <div key={c.candidate_id} className="result-row">
                    <div className="result-meta">
                      <span className="result-name">{c.name}</span>
                      <span className="result-pct">{pct}%</span>
                    </div>
                    <div className="result-bar">
                      <div
                        className="result-fill"
                        style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                      />
                    </div>
                    <div className="result-votes">{c.vote_count.toLocaleString()} votes</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
